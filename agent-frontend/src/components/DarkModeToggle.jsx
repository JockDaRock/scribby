import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

const DarkModeToggle = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600"
      aria-pressed={darkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="sr-only">{darkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
      
      {/* Sun icon for light mode */}
      <span 
        className={`absolute left-1 text-yellow-500 transition-opacity duration-300 ${
          darkMode ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>
      
      {/* Moon icon for dark mode */}
      <span 
        className={`absolute right-1 text-indigo-200 transition-opacity duration-300 ${
          darkMode ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </span>
      
      {/* Toggle switch */}
      <span 
        className={`absolute block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-300 ${
          darkMode ? 'translate-x-6' : 'translate-x-1'
        }`} 
      />
    </button>
  );
};

export default DarkModeToggle;