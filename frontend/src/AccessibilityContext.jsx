import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

const DEFAULT_SETTINGS = {
    fontSize: 'text-base',
    fontFamily: 'font-sans',
    fontStyle: 'font-normal'
};

export function AccessibilityProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('accessibilitySettings');
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    }, [settings]);

    return (
        <div className={`${settings.fontSize} ${settings.fontFamily} ${settings.fontStyle}`}>
            <AccessibilityContext.Provider value={{ settings, setSettings }}>
                {children}
            </AccessibilityContext.Provider>
        </div>
    );
}

export const useAccessibility = () => useContext(AccessibilityContext);