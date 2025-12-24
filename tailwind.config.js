/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#eae6e0',
          300: '#d9d4cc',
          400: '#c4bdb3',
          500: '#a89f93',
          600: '#8a8074',
          700: '#6b6258',
          800: '#4a433c',
          900: '#2d2b29',
          950: '#1f1d1b',
        },
        accent: {
          50: '#faf8f5',
          100: '#f4f0ea',
          200: '#e8dfd3',
          300: '#d9c9b6',
          400: '#c5ad93',
          500: '#b08d6b',
          600: '#9a7454',
          700: '#7d5d47',
          800: '#664d3d',
          900: '#544033',
        },
        warm: {
          light: '#faf9f7',
          base: '#2d2b29',
          dark: '#1f1d1b',
        },
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      animation: {
        blob: "blob 7s infinite",
      },
    },
  },
  plugins: [],
};

