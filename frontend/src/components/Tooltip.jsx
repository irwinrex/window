// src/components/Tooltip.jsx
import React from 'react';

const Tooltip = ({ text, children, position = 'top', className = '' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span className={`relative group inline-block ${className}`}>
      {children}
      {text && ( // Only render tooltip span if text is provided
        <span
          className={`pointer-events-none absolute z-[9999] whitespace-nowrap rounded-md 
                     bg-gray-800 dark:bg-gray-950 
                     px-2.5 py-1.5 text-xs text-white dark:text-gray-200 
                     opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                     transition-opacity duration-200 shadow-lg
                     ${positionClasses[position] || positionClasses.top}
                    `}
          role="tooltip"
        >
          {text}
          {/* Optional: Arrow for tooltip (more complex, but for premium feel) */}
          {/* <span className={`absolute w-2 h-2 bg-gray-800 dark:bg-gray-950 rotate-45 
            ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''}
          `}></span> */}
        </span>
      )}
    </span>
  );
};

export default Tooltip;