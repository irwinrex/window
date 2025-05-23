// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Edit3, Plus, Sun, Moon } from 'lucide-react';

// ThemeToggle Component - Adapted for Aurora Glow style
const ThemeToggle = () => {
  const [isMounted, setIsMounted] = React.useState(false); // To prevent hydration mismatch
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        setIsDarkMode(true);
    } else { // Covers storedTheme === 'light' or no stored theme and not prefersDark
        setIsDarkMode(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isMounted) return; // Only run after initial mount and theme detection
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, isMounted]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!isMounted) { // Avoid rendering mismatched UI during SSR/hydration
    return (
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 rounded-full 
                 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md 
                 border border-white/30 dark:border-gray-700/50
                 shadow-lg shadow-black/5 dark:shadow-black/10
                 hover:bg-white/90 dark:hover:bg-gray-700/90
                 hover:shadow-xl
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 
                 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900
                 transition-all duration-200 ease-out group"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 transition-all duration-300 ease-out group-hover:rotate-[360deg] group-hover:scale-110" />
      ) : (
        <Moon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 transition-all duration-300 ease-out group-hover:rotate-[360deg] group-hover:scale-110" />
      )}
    </button>
  );
};

// Tile Component - Adapted for Aurora Glow style
const Tile = ({ title, onClick, Icon, iconColor, animationDelay }) => {
  const baseClasses = `
    cursor-pointer rounded-2xl sm:rounded-3xl 
    p-6 sm:p-8 text-center 
    transition-all duration-300 ease-out group
    relative overflow-hidden
    border border-white/20 dark:border-gray-700/30
  `;

  // Subtle gradient overlay for a bit of depth, more noticeable on hover
  const gradientOverlay = `
    before:content-[''] before:absolute before:inset-0 
    before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent 
    dark:before:from-white/5 dark:before:via-transparent dark:before:to-transparent
    before:opacity-50 group-hover:before:opacity-100 before:transition-opacity before:duration-300
  `;

  const backgroundClasses = `
    bg-white/60 dark:bg-gray-800/50 
    backdrop-blur-lg 
    group-hover:bg-white/80 dark:group-hover:bg-gray-800/70
  `;
  
  const shadowClasses = `
    shadow-lg shadow-black/5 dark:shadow-black/10 
    group-hover:shadow-xl dark:group-hover:shadow-md
  `;

  const interactionClasses = `
    group-hover:scale-[1.03]
    active:scale-[0.98]
  `;
  
  const focusClasses = `
    focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 
    focus:ring-offset-4 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900
  `;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`${baseClasses} ${backgroundClasses} ${shadowClasses} ${gradientOverlay} ${interactionClasses} ${focusClasses} opacity-0 animate-fade-in-up`}
      style={{ animationDelay }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center h-full"> {/* Content needs to be above pseudo-elements */}
        <Icon className={`mb-4 h-9 w-9 sm:h-10 sm:w-10 ${iconColor} group-hover:scale-110 transition-transform duration-200 ease-out`} />
        <span className="text-md sm:text-lg font-medium text-gray-800 dark:text-gray-100">{title}</span>
      </div>
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();

  const tilesData = [
    { title: "Fetch File", Icon: Download, iconColor: "text-sky-500 dark:text-sky-400", path: '/fetch' },
    { title: "Update File", Icon: Upload, iconColor: "text-emerald-500 dark:text-emerald-400", path: '/update' },
    { title: "Edit File", Icon: Edit3, iconColor: "text-violet-500 dark:text-violet-400", path: '/edit' },
    { title: "Add Server", Icon: Plus, iconColor: "text-amber-500 dark:text-amber-400", path: '/add-server' },
  ];

  return (
    // Background: Using your gray shades, with font-sans for Inter.
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-300 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
      
      {/* Animated Aurora Background Elements */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] sm:w-[60rem] sm:h-[60rem] bg-gradient-radial from-sky-400/40 via-sky-400/10 to-transparent dark:from-sky-500/30 dark:via-sky-500/5 dark:to-transparent rounded-full blur-3xl animate-aurora-pulse-1"></div>
        <div className="absolute bottom-[-30%] right-[-15%] w-[35rem] h-[35rem] sm:w-[50rem] sm:h-[50rem] bg-gradient-radial from-violet-400/40 via-violet-400/10 to-transparent dark:from-violet-500/30 dark:via-violet-500/5 dark:to-transparent rounded-full blur-3xl animate-aurora-pulse-2"></div>
        <div className="absolute top-[10%] right-[5%] w-[30rem] h-[30rem] sm:w-[45rem] sm:h-[45rem] bg-gradient-radial from-emerald-400/30 via-emerald-400/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/3 dark:to-transparent rounded-full blur-3xl animate-aurora-pulse-3"></div>
      </div>

      <ThemeToggle />
      
      <header className="mb-12 sm:mb-16 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-50 opacity-0 animate-fade-in-down">
          Secure Server <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 dark:from-sky-400 dark:via-indigo-400 dark:to-violet-500">Manager</span>
        </h1>
        <p 
          className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto opacity-0 animate-fade-in-down" 
          style={{ animationDelay: '150ms' }}
        >
          Modern tools for seamless server configuration and robust file management. Fast, expressive, aesthetic.
        </p>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full max-w-xs sm:max-w-2xl lg:max-w-5xl relative z-10">
        {tilesData.map((tile, index) => (
          <Tile
            key={tile.title}
            title={tile.title}
            Icon={tile.Icon}
            iconColor={tile.iconColor}
            onClick={() => navigate(tile.path)}
            animationDelay={`${(index * 100) + 300}ms`}
          />
        ))}
      </div>
    </div>
  );
}