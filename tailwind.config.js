/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      colors: {
        brand: {
          50:  '#fff3ee',
          100: '#ffe4d0',
          200: '#ffc4a0',
          300: '#ff9c66',
          400: '#ff6b2b',
          DEFAULT: '#f04e00',
          500: '#f04e00',
          600: '#c93d00',
          700: '#a02f00',
          800: '#7a2300',
          900: '#4a1500',
        },
      },
      boxShadow: {
        'brand-glow': '0 0 20px rgba(240, 78, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
