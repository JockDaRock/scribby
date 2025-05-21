import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

const DarkModeToggle = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={darkMode}
        onChange={toggleTheme}
        className="sr-only"
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      />
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          darkMode
            ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900'
            : 'bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200'
        }`}
        aria-pressed={darkMode}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Stars for dark mode */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            darkMode ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-3 left-1 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="absolute top-2 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-150"></div>
            <div className="absolute top-1.5 right-2 w-1 h-1 bg-white rounded-full animate-pulse delay-200"></div>
            <div className="absolute top-3.5 right-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-100"></div>
          </div>
          
          {/* Clouds for light mode */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            darkMode ? 'opacity-0' : 'opacity-100'
          }`}>
            <div className="absolute top-2 left-1 w-3 h-1.5 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-3.5 left-2.5 w-2 h-1 bg-white rounded-full opacity-40"></div>
            <div className="absolute top-1.5 right-1 w-2.5 h-1.5 bg-white rounded-full opacity-50"></div>
            <div className="absolute bottom-2 right-2.5 w-2 h-1 bg-white rounded-full opacity-30"></div>
          </div>
        </div>
        
        {/* Toggle circle with sun/moon */}
        <div className={`relative inline-flex h-6 w-6 transform items-center justify-center rounded-full transition-all duration-500 ease-in-out ${
          darkMode 
            ? 'translate-x-9 bg-gradient-to-br from-gray-200 to-gray-300 shadow-lg'
            : 'translate-x-1 bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-lg'
        }`}>
          {/* Sun icon (visible in light mode) */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            darkMode ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}>
            <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
          </div>
          
          {/* Moon icon (visible in dark mode) */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'
          }`}>
            <svg className="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </div>
          
          {/* Moon craters for dark mode */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            darkMode ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute top-2 left-2 w-1 h-1 bg-gray-400 rounded-full opacity-40"></div>
            <div className="absolute bottom-2 right-1.5 w-0.5 h-0.5 bg-gray-400 rounded-full opacity-30"></div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default DarkModeToggle;