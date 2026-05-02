/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        blue: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#C0DFFF',
          300: '#90C8FF',
          400: '#5AA3FF',
          500: '#0066CC',
          600: '#0057B3',
          700: '#004999',
          800: '#003A80',
          900: '#002B66',
        },
        amber: {
          50: '#FFFAEB',
          100: '#FFF0C6',
          200: '#FFE799',
          300: '#FFD966',
          400: '#E6B333',
          500: '#D99700',
          600: '#CC7700',
          700: '#B35C00',
          800: '#994D00',
          900: '#803D00',
        },
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'slide-up': 'slideUp 0.3s ease-in-out forwards',
        'hover-lift': 'hoverLift 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        hoverLift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};