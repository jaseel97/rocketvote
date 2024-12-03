import { createContext, useContext, useState } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
    const [settings, setSettings] = useState({
        fontSize: 'text-base',
        fontFamily: 'font-sans',
        fontStyle: 'font-normal'
    });
 
   return (
       <div className={`${settings.fontSize} ${settings.fontFamily} ${settings.fontStyle}`}>
           <AccessibilityContext.Provider value={{ settings, setSettings }}>
               {children}
           </AccessibilityContext.Provider>
       </div>
   );
}

export const useAccessibility = () => useContext(AccessibilityContext);