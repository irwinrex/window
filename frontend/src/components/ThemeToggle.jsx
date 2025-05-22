import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Toggle dark/light theme"
      aria-pressed={dark}
      onClick={() => setDark(!dark)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setDark(!dark);
      }}
      title="Toggle Theme"
      className="absolute top-6 right-6 cursor-pointer select-none
                 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
                 transition-transform"
    >
      {dark ? (
        <Moon
          className="h-7 w-7 text-white animate-pulse hover:animate-spin-slow transition-transform"
          strokeWidth={1.5}
        />
      ) : (
        <Sun
          className="h-7 w-7 text-yellow-400 animate-bounce-slow hover:animate-wiggle transition-transform"
          strokeWidth={1.5}
        />
      )}
    </div>
  );
}
