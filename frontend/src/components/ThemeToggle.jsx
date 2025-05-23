// src/components/ThemeToggle.jsx
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react'; // Make sure lucide-react is installed

export default function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to false, will be corrected by useEffect

  useEffect(() => {
    setIsMounted(true);
    let initialDarkMode = false;
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        initialDarkMode = true;
      } else if (storedTheme === 'light') {
        initialDarkMode = false;
      } else {
        // No stored theme, check system preference
        initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (error) {
      console.warn("Could not access localStorage for theme preference:", error);
      // Fallback to system preference if localStorage fails
      try {
        initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (e) {
        // If even matchMedia fails, default to light (false)
        initialDarkMode = false; 
        console.warn("Could not access matchMedia for theme preference:", e);
      }
    }
    setIsDarkMode(initialDarkMode);
  }, []); // Runs once on mount to determine initial theme

  useEffect(() => {
    if (!isMounted) return; // Don't run on initial render before theme is determined
    
    const root = document.documentElement;
    try {
      if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (error) {
      console.warn("Could not update theme in localStorage:", error);
      // Still try to update classList if localStorage fails
       if (isDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [isDarkMode, isMounted]); // Runs when isDarkMode or isMounted changes

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  if (!isMounted) {
    // Render a placeholder or null during SSR or before hydration to avoid mismatch
    // A simple div with sizing matching the button can prevent layout shifts
    return <div className="p-2 w-[36px] h-[36px] rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-full 
                 text-gray-600 dark:text-gray-300
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 
                 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800/80 
                 transition-colors duration-200 ease-out group" // Added dark:focus:ring-offset-gray-800/80 for backdrop header
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-300 ease-out group-hover:rotate-[90deg]" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-500 transition-transform duration-300 ease-out group-hover:rotate-[90deg]" />
      )}
    </button>
  );
}