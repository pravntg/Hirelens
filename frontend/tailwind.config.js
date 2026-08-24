/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resumind: {
          bg: '#FFEDD5',
          card: '#FFFFFF',
          cardHover: '#FFF7ED',
          border: '#FDBA74',
          orange: '#EA580C',
          orangeLight: '#FFEDD5',
          orangeBright: '#F97316',
          textDark: '#7C2D12',
          textMuted: '#9A3412',
          slate: '#E2E8F0'
        }
      }
    },
  },
  plugins: [],
}
