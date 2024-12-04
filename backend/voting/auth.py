from django.conf import settings
from django.http import HttpResponseForbidden, HttpResponseBadRequest, HttpResponseRedirect, JsonResponse
import requests
from functools import wraps
from datetime import datetime
import json
import redis
import os
import msal
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError, InvalidTokenError

class AzureADTokenVerifier:
    def __init__(self):
        self.tenant_id = settings.MICROSOFT_AUTH['TENANT_ID']
        self.client_id = settings.MICROSOFT_AUTH['CLIENT_ID']
        self._redis_client = redis.StrictRedis(host='redis', port=6379, db=4)
        self.local_jwks_file = 'local_jwks.json'

    def get_jwks(self):
        """Fetch JSON Web Key Set from Redis cache or Microsoft's endpoint"""
        cached_jwks = self._redis_client.get('jwks_cache')
        if cached_jwks:
            return json.loads(cached_jwks)

        try:
            jwks_url = f'https://login.microsoftonline.com/{self.tenant_id}/discovery/v2.0/keys'
            response = requests.get(jwks_url)
            jwks = response.json()
            
            # Cache the JWKS in Redis
            self._redis_client.setex('jwks_cache', 86400, json.dumps(jwks))  # Cache for 24 hours

            # Update local failover file
            with open(self.local_jwks_file, 'w') as f:
                json.dump(jwks, f)

            return jwks
        except Exception as e:
            # Use local failover if available
            if os.path.exists(self.local_jwks_file):
                with open(self.local_jwks_file, 'r') as f:
                    return json.load(f)
            raise RuntimeError(f"Failed to fetch JWKS: {str(e)}")

    def get_key(self, kid):
        """Get the appropriate key from JWKS based on the key ID"""
        jwks = self.get_jwks()
        for key in jwks['keys']:
            if key['kid'] == kid:
                return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        raise ValueError(f'Key ID {kid} not found in JWKS')

    def verify_access(self, token):
        """Verify if the user has the required role or group access"""
        is_valid, decoded = self.verify_token(token)
        if not is_valid:
            return False, decoded

        required_identifier = settings.ENTRA_APP_ACCESS_IDENTIFIER

        roles = decoded.get('roles', [])
        if required_identifier in roles:
            return True, decoded

        groups = decoded.get('groups', [])
        if required_identifier in groups:
            return True, decoded

        return False, "User does not have required access"

    def verify_token(self, token):
        """
        Verify the Azure AD JWT token
        Returns (True, decoded_token) if valid, (False, error_message) if invalid
        """
        try:
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            if not kid:
                return False, "No key ID found in token header"
            
            public_key = self.get_key(kid)
            
            # Verify and decode the token
            decoded = jwt.decode(
                token,
                key=public_key,
                algorithms=['RS256'],
                audience=self.client_id,
                options={
                    'verify_exp': True,
                    'verify_iat': True,
                    'verify_nbf': True,
                }
            )
            
            expected_issuer = f'https://sts.windows.net/{self.tenant_id}/'
            alt_expected_issuer = f'https://login.microsoftonline.com/{self.tenant_id}/v2.0'
            
            if decoded.get('iss') not in [expected_issuer, alt_expected_issuer]:
                return False, "Invalid token issuer"
            
            if not decoded.get('sub'):
                return False, "Missing subject claim"
            
            return True, decoded
        
        except ExpiredSignatureError:
            return False, "Token has expired"
        except InvalidAudienceError:
            return False, "Invalid token audience"
        except InvalidIssuerError:
            return False, "Invalid token issuer"
        except InvalidTokenError as e:
            return False, f"Invalid token: {str(e)}"
        except Exception as e:
            return False, f"Token verification failed: {str(e)}"
        
def oauth_callback(request):
    code = request.GET.get('code')
    return_path = request.GET.get('state', '/')

    msal_app = msal.ConfidentialClientApplication(
        client_id=settings.MICROSOFT_AUTH['CLIENT_ID'],
        client_credential=settings.MICROSOFT_AUTH['CLIENT_SECRET'],
        authority=f"https://login.microsoftonline.com/{settings.MICROSOFT_AUTH['TENANT_ID']}"
    )

    try:
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=['User.Read'],
            redirect_uri=settings.MICROSOFT_AUTH['REDIRECT_URI']
        )

        if 'error' in result:
            return HttpResponseBadRequest(f"Error acquiring token: {result.get('error_description')}")

        id_token = result.get('id_token')
        access_token = result.get('access_token')

        print("ID TOKEN:", id_token)
        print("ACCESS TOKEN: ", access_token)
        
        if not id_token or not access_token:
            return HttpResponseBadRequest("Missing required tokens from Azure AD")

        verifier = AzureADTokenVerifier()
        
        is_valid, decoded_token = verifier.verify_token(id_token)
        if not is_valid:
            return HttpResponseBadRequest(f"ID token verification failed: {decoded_token}")
            
        has_access, access_result = verifier.verify_access(id_token)
        if not has_access:
            return HttpResponseForbidden(f"Access denied: {access_result}")

        response = HttpResponseRedirect(return_path)
        response.set_cookie(
            'auth_token',
            id_token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=3600
        )
        response.set_cookie(
            'access_token',
            access_token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=3600
        )
        return response

    except Exception as e:
        return HttpResponseBadRequest(f"Authentication failed: {str(e)}")
    

def is_authenticated(view_func):
    """Decorator to verify Azure AD tokens and access"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        id_token = request.COOKIES.get('auth_token')
        access_token = request.COOKIES.get('access_token')
        
        if not id_token or not access_token:
            return HttpResponseForbidden('Missing required tokens')

        verifier = AzureADTokenVerifier()
        
        is_valid, result = verifier.verify_token(id_token)
        if not is_valid:
            return HttpResponseForbidden(f'Invalid ID token: {result}')
            
        has_access, access_result = verifier.verify_access(id_token)
        if not has_access:
            return HttpResponseForbidden(f'Access denied: {access_result}')

        request.user = {
            'name': result.get('name'),
            'email': result.get('preferred_username'),
            'object_id': result.get('oid'),
        }
        request.azure_user = result
        request.access_token = access_token
        
        return view_func(request, *args, **kwargs)

    return wrapper

def verify_auth(request):
    id_token = request.COOKIES.get('auth_token')
    access_token = request.COOKIES.get('access_token')
    
    if not id_token or not access_token:
        return JsonResponse({
            'authenticated': False,
            'error': 'Missing required tokens'
        }, status=401)

    verifier = AzureADTokenVerifier()
    
    is_valid, result = verifier.verify_token(id_token)
    if not is_valid:
        return JsonResponse({
            'authenticated': False,
            'error': result
        }, status=401)
        
    has_access, access_result = verifier.verify_access(id_token)
    if not has_access:
        return JsonResponse({
            'authenticated': False,
            'error': access_result
        }, status=403)

    return JsonResponse({
        'authenticated': True,
        'user_info': result
    })