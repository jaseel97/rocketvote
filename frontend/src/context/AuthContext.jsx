import { createContext, useContext, useEffect, useState } from 'react';
import { ENTRA_CLIENT_ID, ENTRA_REDIRECT_URI, ENTRA_TENANT_ID } from '../Config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAuthStatus = async () => {
        try {
            const response = await fetch('/api/auth/verify');
            const data = await response.json();
            setIsAuthenticated(data.authenticated);
        } finally {
            setIsLoading(false);
        }
    };

    const redirectToLogin = () => {
        const returnUrl = encodeURIComponent(window.location.pathname);
        // adf55c08-b67b-4701-ad38-5cca21d455b0
        // f647dc60-9ca8-4a99-ae7a-7f232d23cd79
        // console.log("ENV URI : ", ENTRA_REDIRECT_URI)
        // console.log("ENV OTF : ", encodeURIComponent(window.location.origin + '/api/oauth2/callback'))
        // window.location.href = `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/oauth2/v2.0/authorize?client_id=${ENTRA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/api/oauth2/callback')}&scope=User.Read&state=${returnUrl}`;
        window.location.href = `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/oauth2/v2.0/authorize?` +
            `client_id=${ENTRA_CLIENT_ID}` +
            `&response_type=code` +
            `&redirect_uri=${ENTRA_REDIRECT_URI}` +
            `&scope=User.Read` +
            `&state=${returnUrl}`;
    };

    useEffect(() => {
        fetchAuthStatus();
    }, []);

    if (isLoading) return <div>Loading...</div>;

    return (
        <AuthContext.Provider value={{ isAuthenticated, redirectToLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);