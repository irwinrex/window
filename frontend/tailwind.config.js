// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        gray: {
          900: '#111111',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
          500: '#4a4a4a',
          400: '#6b6b6b',
          300: '#9b9b9b',
          200: '#cfcfcf',
          100: '#eeeeee',
        },
      },
      backgroundImage: { // Added for better radial gradient support if needed
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        // Your existing animations (some might be overridden or unused by new style):
        fade: 'fadeIn 0.1s ease-in-out',
        slide: 'slideIn 0.2s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        wiggle: 'wiggle 0.5s ease-in-out infinite',

        // Animations for "Aurora Glow" UI:
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'aurora-pulse-1': 'auroraPulse1 20s infinite ease-in-out alternate',
        'aurora-pulse-2': 'auroraPulse2 25s infinite ease-in-out alternate -5s',
        'aurora-pulse-3': 'auroraPulse3 22s infinite ease-in-out alternate -10s',
      },
      keyframes: {
        // Your existing keyframes:
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },

        // Keyframes for "Aurora Glow" UI:
        fadeInDown: { // Adjusted for Aurora Glow style
          '0%': { opacity: '0', transform: 'translateY(-25px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: { // Adjusted for Aurora Glow style
          '0%': { opacity: '0', transform: 'translateY(25px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        auroraPulse1: {
          '0%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)', opacity: '0.2' },
          '25%': { transform: 'scale(1.1) translate(2vw, -3vh) rotate(5deg)', opacity: '0.35' },
          '50%': { transform: 'scale(1.2) translate(-1vw, 4vh) rotate(-5deg)', opacity: '0.5' },
          '75%': { transform: 'scale(1.1) translate(-3vw, -2vh) rotate(3deg)', opacity: '0.35' },
          '100%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)', opacity: '0.2' },
        },
        auroraPulse2: {
          '0%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)', opacity: '0.15' },
          '25%': { transform: 'scale(1.2) translate(-2vw, 2vh) rotate(-6deg)', opacity: '0.3' },
          '50%': { transform: 'scale(1.3) translate(3vw, -3vh) rotate(4deg)', opacity: '0.4' },
          '75%': { transform: 'scale(1.1) translate(1vw, 1vh) rotate(-2deg)', opacity: '0.3' },
          '100%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)', opacity: '0.15' },
        },
        auroraPulse3: {
          '0%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)', opacity: '0.1' },
          '25%': { transform: 'scale(1.15) translate(1vw, 3vh) rotate(3deg)', opacity: '0.25' },
          '50%': { transform: 'scale(1.25) translate(-2vw, -2vh) rotate(-3deg)', opacity: '0.35' },
          '75%': { transform: 'scale(1.1) translate(2vw, 1vh) rotate(1deg)', opacity: '0.25' },
          '100%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)', opacity: '0.1' },
        },
        // Removed 'pulseBg' keyframes as it's specific to the previous style's background
      },
    },
  },
  plugins: [],
};