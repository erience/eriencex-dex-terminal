/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#161A1E',
        'semi-dark': '#1E2026',
        'light-gray': '#848E9C',
        light: '#1D2127',
        backdrop: 'rgba(0, 0, 0, 0.5)'
      },
      boxShadow: {
        'full-light': '0 0 10px 0 rgba(255, 255, 255, 0.2)'
      },
      fontSize: {
        xxs: '10px',
        '2xs': '8px'
      },
      fontFamily: {
        jetbrains: ['JetBrains Mono', 'monospace']
      },
      screens: {
        xxl: '1024px'
      }
    }
  },
  plugins: [require('daisyui')]
}
