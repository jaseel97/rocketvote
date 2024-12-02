import React from 'react';

// export const StyledToggle = ({ isChecked, onChange, label }) => {
//   return (
//     <div className="flex items-center">
//       <button
//         onClick={() => onChange(!isChecked)}
//         className={`relative h-6 w-11 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
//           ${isChecked 
//             ? 'bg-red-500 dark:bg-red-400' 
//             : 'bg-gray-300 dark:bg-gray-500'}`}
//         type="button"
//         role="switch"
//         aria-checked={isChecked}
//       >
//         <span className="sr-only">Toggle {label}</span>
//         <span
//           className={`absolute left-0.5 top-0.5 flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out
//             ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}
//         >
//           {isChecked ? (
//             <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 12 12">
//               <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
//             </svg>
//           ) : (
//             <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 12 12">
//               <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
//               </svg>
//           )}
//         </span>
//       </button>
//       <label
//         className={`w-full ms-2 text-sm font-medium cursor-pointer
//           ${isChecked 
//             ? 'text-red-500 dark:text-red-400' 
//             : 'text-gray-900 dark:text-white'}
//           group-hover:text-red-500 dark:group-hover:text-red-400
//           transition-colors duration-300`}
//       >
//         {label}
//       </label>
//     </div>
//   );
// };

// export const StyledToggle = ({ isChecked, onChange, label }) => {
//   return (
//     <div className="flex items-center gap-3 group">
//       <button
//         onClick={() => onChange(!isChecked)}
//         className={`relative h-8 w-16 rounded-full transition-colors duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
//           ${isChecked 
//             ? 'bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500' 
//             : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
//         type="button"
//         role="switch"
//         aria-checked={isChecked}
//       >
//         <span className="sr-only">Toggle {label}</span>
//         <span
//           className={`absolute left-1 top-1 flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out
//             ${isChecked ? 'translate-x-8' : 'translate-x-0'}
//             ${isChecked ? 'shadow-red-500/20' : 'shadow-gray-500/20'}`}
//         >
//           {isChecked ? (
//             <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 12 12">
//               <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
//             </svg>
//           ) : (
//             <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 12 12">
//               <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
//             </svg>
//           )}
//         </span>
//       </button>
//       <label
//         className={`text-base font-medium cursor-pointer select-none
//           ${isChecked 
//             ? 'text-red-500 dark:text-red-400' 
//             : 'text-gray-700 dark:text-gray-200'}
//           group-hover:text-red-500 dark:group-hover:text-red-400
//           transition-colors duration-500`}
//       >
//         {label}
//       </label>
//     </div>
//   );
// };

export const StyledToggle = ({ isChecked, onChange, label }) => {
  return (
    <div className="flex items-center gap-3 group">
      <button
        onClick={() => onChange(!isChecked)}
        className={`relative h-8 w-16 rounded-full border-2 transition-all duration-500 ease-in-out focus:outline-none
          ${isChecked 
            ? `bg-purple-100/50 dark:bg-purple-900/50
               border-purple-500/30 dark:border-purple-400/30
               shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(147,51,234,0.2)]
               dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(192,132,252,0.2)]
               hover:border-purple-500/50 dark:hover:border-purple-400/50
               hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_15px_rgba(147,51,234,0.3)]
               dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_15px_rgba(192,132,252,0.3)]` 
            : `bg-gray-100/50 dark:bg-gray-900/50
               border-gray-300/30 dark:border-gray-500/30
               shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
               dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
               hover:border-gray-300/50 dark:hover:border-gray-500/50
               hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.1),inset_-4px_-4px_10px_0_rgba(255,255,255,0.9)]
               dark:hover:shadow-[inset_4px_4px_10px_0_rgba(0,0,0,0.3),inset_-4px_-4px_10px_0_rgba(255,255,255,0.1)]`}`}
        type="button"
        role="switch"
        aria-checked={isChecked}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          className={`absolute left-1 top-0.5 flex h-6 w-6 transform items-center justify-center rounded-full 
            transition-all duration-500 ease-in-out
            ${isChecked 
              ? 'translate-x-8 bg-purple-500 dark:bg-purple-400' 
              : 'translate-x-0 bg-gray-300 dark:bg-gray-500'}
            shadow-[2px_2px_5px_0_rgba(0,0,0,0.1),-2px_-2px_5px_0_rgba(255,255,255,0.9)]
            dark:shadow-[2px_2px_5px_0_rgba(0,0,0,0.3),-2px_-2px_5px_0_rgba(255,255,255,0.1)]`}
        >
          <div className="flex items-center justify-center w-full h-full">
            {isChecked ? (
              <svg className="h-4 w-4 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 12 12">
                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </span>
      </button>
      <label
        className={`text-base font-medium cursor-pointer select-none
          ${isChecked 
            ? 'text-purple-500 dark:text-purple-400' 
            : 'text-gray-700 dark:text-gray-300'}
          group-hover:text-purple-500 dark:group-hover:text-purple-400
          transition-colors duration-500`}
      >
        {label}
      </label>
    </div>
  );
};

export default StyledToggle;