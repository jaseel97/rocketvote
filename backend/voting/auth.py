from django.conf import settings
from django.http import HttpResponseForbidden, HttpResponseBadRequest, HttpResponseRedirect, JsonResponse
import jwt
import requests
from functools import wraps
from datetime import datetime
import json
import msal

class AzureADTokenVerifier:
    def __init__(self):
        self.tenant_id = settings.MICROSOFT_AUTH['TENANT_ID']
        self.client_id = settings.MICROSOFT_AUTH['CLIENT_ID']
        self._jwks_cache = None
        self._jwks_cache_timestamp = None
        
    def get_jwks(self):
        """Fetch JSON Web Key Set from Microsoft's endpoint"""
        if (self._jwks_cache and self._jwks_cache_timestamp and 
            (datetime.now() - self._jwks_cache_timestamp).total_seconds() < 86400):
            return self._jwks_cache
            
        jwks_url = f'https://login.microsoftonline.com/{self.tenant_id}/discovery/v2.0/keys'
        response = requests.get(jwks_url)
        self._jwks_cache = response.json()
        self._jwks_cache_timestamp = datetime.now()
        return self._jwks_cache
        
    def get_key(self, kid):
        """Get the appropriate key from JWKS based on the key ID"""
        jwks = self.get_jwks()
        for key in jwks['keys']:
            if key['kid'] == kid:
                return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        raise ValueError(f'Key ID {kid} not found in JWKS')
        
    def verify_token(self, token):
        """Verify the JWT ID token from Azure AD"""
        try:
            header = jwt.get_unverified_header(token)
            key = self.get_key(header['kid'])

            expected_issuer = f'https://login.microsoftonline.com/{self.tenant_id}/v2.0'
            

            decoded = jwt.decode(
                token,
                key=key,
                algorithms=['RS256'],
                audience=self.client_id,
                issuer=expected_issuer,
                options={
                    'verify_nbf': True,
                    'verify_exp': True,
                    'verify_iat': True
                }
            )
            
            if 'sub' not in decoded:
                return False, "Missing 'sub' claim in ID token"
                
            return True, decoded
            
        except jwt.ExpiredSignatureError:
            return False, "Token has expired"
        except jwt.InvalidAudienceError:
            return False, "Invalid audience"
        except jwt.InvalidIssuerError:
            return False, "Invalid issuer"
        except jwt.InvalidSignatureError:
            return False, "Invalid signature"
        except Exception as e:
            return False, str(e)

def verify_azure_token(view_func):
    """Decorator to verify Azure AD ID token from cookie"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = request.COOKIES.get('auth_token')
        if not token:
            return HttpResponseForbidden('No token provided')
            
        verifier = AzureADTokenVerifier()
        is_valid, result = verifier.verify_token(token)
        
        if not is_valid:
            return HttpResponseForbidden(f'Invalid token: {result}')
            
        request.azure_user = result
        return view_func(request, *args, **kwargs)
        
    return wrapper

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
        if not id_token:
            return HttpResponseBadRequest("No ID token received from Azure AD")
            
        verifier = AzureADTokenVerifier()
        is_valid, decoded_token = verifier.verify_token(id_token)
        
        if not is_valid:
            return HttpResponseBadRequest(f"Token verification failed: {decoded_token}")
        
        response = HttpResponseRedirect(return_path)
        response.set_cookie(
            'auth_token',
            id_token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=3600
        )
        
        return response
        
    except Exception as e:
        return HttpResponseBadRequest(f"Authentication failed: {str(e)}")

# def verify_auth(request):
#     if 'auth_token' in request.COOKIES:
#         return JsonResponse({'authenticated': True})
#     return JsonResponse({'authenticated': False})

def verify_auth(request):
    if 'auth_token' in request.COOKIES:
        verifier = AzureADTokenVerifier()
        is_valid, result = verifier.verify_token(request.COOKIES['auth_token'])
        
        if is_valid:
            return JsonResponse({
                'authenticated': True,
                'user_info': result
            })
        else:
            return JsonResponse({
                'authenticated': False,
                'error': result
            }, status=401)
    
    return JsonResponse({
        'authenticated': False,
        'error': 'No authentication token found'
    }, status=401)