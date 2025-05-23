// src/components/Tooltip.jsx
import React from 'react';

/**
 * Tooltip component for accessibility and usability.
 * Usage:
 * <Tooltip text="Your tooltip text here"><button>Hover me</button></Tooltip>
 * Accepts optional wrapperClassName for z-index or layout fixes.
 */
const Tooltip = ({ text, children, position = 'top', wrapperClassName = '' }) => {
  return (
    <span className={`group inline-block ${wrapperClassName}`} tabIndex={0} style={{ position: 'relative', zIndex: 50 }}>
      {children}
      <span
        className={`pointer-events-none absolute whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200
          ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
          ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
          ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
          ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
        `}
        style={{ zIndex: 1000 }}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
};

export default Tooltip;