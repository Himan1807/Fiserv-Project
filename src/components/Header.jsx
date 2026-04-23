import React from 'react';
import { ShieldAlert, Moon, Sun } from 'lucide-react';

export const Header = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Real-Time UPI Fraud Detection Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor and analyze suspicious transactions in real-time
          </p>
        </div>
      </div>
      
      <button 
        onClick={toggleDarkMode}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-gray-600" />
        )}
      </button>
    </header>
  );
};
