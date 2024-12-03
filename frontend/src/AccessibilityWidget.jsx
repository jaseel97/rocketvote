import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAccessibility } from './AccessibilityContext';

const AccessibilityWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, setSettings } = useAccessibility();
   
    const progressStates = {
        fontSize: ['text-base', 'text-lg', 'text-xl'],
        fontFamily: ['font-sans', 'font-serif', 'font-mono'],
        fontStyle: ['font-normal', 'italic', 'font-bold']
      };
   
    const handleSettingClick = (setting) => {
      const currentIndex = progressStates[setting].indexOf(settings[setting]);
      const nextIndex = (currentIndex + 1) % 3;
      setSettings({
        ...settings,
        [setting]: progressStates[setting][nextIndex]
      });
    };
   
    const handleReset = () => {
        setSettings({
          fontSize: 'text-base',
          fontFamily: 'font-sans',
          fontStyle: 'font-normal'
        });
      };

 const getActiveSegments = (setting) => {
   const index = progressStates[setting].indexOf(settings[setting]);
   return index + 1;
 };

 return (
   <div className="relative">
     <button
       onClick={() => setIsOpen(!isOpen)}
       className="fixed bottom-4 left-4 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
       aria-label="Accessibility Options"
     >
       <ChevronDownIcon className="w-6 h-6" />
     </button>

     {isOpen && (
       <div className="fixed bottom-16 left-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
         <div className="grid grid-cols-3 gap-4 mb-4">
           {[
             { setting: 'fontSize', icon: 'TT', label: 'Font Size' },
             { setting: 'fontFamily', icon: 'F', label: 'Font' },
             { setting: 'fontStyle', icon: "FS", label: 'Font Style' }
           ].map(({ setting, icon, label }) => (
             <button 
               key={setting}
               className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center"
               onClick={() => handleSettingClick(setting)}
             >
               <div className="text-lg mb-2 dark:text-white">
                 {typeof icon === 'string' ? icon : icon}
               </div>
               <div className="w-full flex gap-0.5 mb-2">
                 {[1, 2, 3].map((segment) => (
                   <div 
                     key={segment}
                     className={`h-1 flex-1 rounded-sm transition-colors duration-300 ${
                       segment <= getActiveSegments(setting) 
                         ? 'bg-blue-600' 
                         : 'bg-gray-200 dark:bg-gray-600'
                     }`}
                   />
                 ))}
               </div>
               <div className="text-xs dark:text-gray-300">{label}</div>
             </button>
           ))}
         </div>

         <button 
           onClick={handleReset}
           className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors dark:text-white"
         >
           Reset All Accessibility Settings
         </button>
       </div>
     )}
   </div>
 );
};

export default AccessibilityWidget;