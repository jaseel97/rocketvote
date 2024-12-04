/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,}",
  ],
  // Enable class-based dark mode
  darkMode: 'class',
  theme: {
    extend: {
      // Preserve existing animations
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        }
      },
      animation: {
        wiggle: 'wiggle 0.4s ease-in-out infinite',
      },
      fontSize: {
        'base': '1rem', 
        'lg': '1.5rem',   
        'xl': '2rem',
      },
      fontFamily: {
        'serif': ['ui-sans-serif', 'system-ui', 'sans-serif'],
        'sans': ['ui-serif', 'Georgia', 'Cambria'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo']
      },
      fontStyle: {
        'default': {
          fontStyle: 'normal',
          fontWeight: 'normal'
        },
        'italic': {
          fontStyle: 'italic'
        },
        'bold': {
          fontWeight: 'bold'
        }
      },
      // Add custom colors for consistency
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',  // Base red color
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
      },
      // Add transitions for smooth theme switching
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
      // Add custom timing functions
      transitionTimingFunction: {
        'theme': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Add custom durations
      transitionDuration: {
        'theme': '200ms',
      },
    },
  },
  plugins: [],
}