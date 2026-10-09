/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taupe: {
          50: '#f9f7f5',
          100: '#f2ede7',
          200: '#e5dbd0',
          300: '#d2c1b1',
          400: '#baa390',
          500: '#a68c78',
          600: '#967b66',
          700: '#7d6453',
          800: '#675346',
          900: '#55443a',
          950: '#2d231d',
        },
        cream: {
          50: '#fdfcfb',
          100: '#faf7f3',
          200: '#f5eee6',
          300: '#ece0d3',
          card: '#f4efe8',
          cardLight: '#f9f6f1',
          border: 'rgba(255, 255, 255, 0.45)',
        },
        espresso: {
          light: '#6e5e51',
          DEFAULT: '#3e342b',
          dark: '#261f19',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}
