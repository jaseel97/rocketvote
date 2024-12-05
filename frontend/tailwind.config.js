/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,}",
  ],

  darkMode: 'class',
  theme: {
    extend: {
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
        'big': '1.5rem',   
        'bigger': '2rem',
      },
      fontFamily: {
        'sans': ['Doto', 'ui-serif', 'Georgia', 'Cambria'],
        'serif': ['"Noto Sans"', 'system-ui', 'sans-serif'],
        'mono': ['"Faculty Glyphic"', 'SFMono-Regular', 'Menlo']
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
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', 
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
      transitionTimingFunction: {
        'theme': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'theme': '200ms',
      },
    },
  },
  plugins: [],
}