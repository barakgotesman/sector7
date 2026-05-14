/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'soviet-red': '#cc2200',
        'cctv-green': '#1a3a1a',
        'paper-white': '#d4cfc4',
        'dark-steel': '#333333',
      },
      fontFamily: {
        courier: ['"Courier Prime"', 'Courier New', 'monospace'],
        elite: ['"Special Elite"', 'serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
