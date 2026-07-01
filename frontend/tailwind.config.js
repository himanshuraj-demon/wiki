/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // IITGN Color Palette
        iitgn: {
          maroon: {
            light: '#a82c2c',
            DEFAULT: '#851c1c',
            dark: '#611010',
          },
          gold: {
            light: '#f59e0b',
            DEFAULT: '#d97706',
            dark: '#b45309',
          },
          blue: {
            light: '#4f46e5',
            DEFAULT: '#3730a3',
          }
        },
        // Wikipedia-inspired theme colors
        wiki: {
          border: '#a2a9b1',
          bg: '#f8f9fa',
          hover: '#eaecf0',
          text: '#202122',
          link: '#0645ad',
          linkVisited: '#0b0080',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
