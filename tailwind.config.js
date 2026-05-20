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
        gold: {
          50:  '#fffdf0',
          100: '#fff9cc',
          200: '#fff380',
          300: '#ffe033',
          400: '#f5c518',
          500: '#d4af37',
          600: '#b8960c',
          700: '#9a7a0a',
          800: '#7a5f08',
          900: '#5a4506',
        },
      },
      boxShadow: {
        'brand-glow': '0 0 20px rgba(240, 78, 0, 0.3)',
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [],
}
