/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/contexts/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-plex-sans)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      colors: {
        ink: '#14161C',
        surface: '#1D2027',
        'surface-hover': '#242832',
        border: '#2B2F39',
        ash: '#93979F',
        bone: '#ECE9E2',
        // career pipeline accent - warm, ambitious
        career: '#DB9255',
        'career-soft': 'rgba(219,146,85,0.15)',
        // wellness pipeline accent - cool, calm
        wellness: '#5FA39B',
        'wellness-soft': 'rgba(95,163,155,0.15)',
        // reserved only for genuine risk flags
        risk: '#D9614D',
        'risk-soft': 'rgba(217,97,77,0.15)',
        stable: '#84A873',
        'stable-soft': 'rgba(132,168,115,0.15)',
      },
    },
  },
  plugins: [],
}
