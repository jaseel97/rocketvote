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

    if (isLoading)
        return <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-700">Authenticating...</span>
        </div>;

    return (
        <AuthContext.Provider value={{ isAuthenticated, redirectToLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);