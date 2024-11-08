import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from './ThemeContext';

const ThemeToggle = () => {
    const { darkMode, setDarkMode } = useTheme();

    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            className="fixed top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg"
            aria-label="Toggle theme"
        >
            {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-500" />
            ) : (
                <MoonIcon className="w-6 h-6 text-gray-600" />
            )}
        </button>
    );
};

export default ThemeToggle;