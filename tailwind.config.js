/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#12372A',
        gold: '#C9A227',
        cream: '#F4F7F5'
      },
      boxShadow: {
        card: '0 10px 30px rgba(18, 55, 42, 0.08)'
      }
    }
  },
  plugins: []
}
