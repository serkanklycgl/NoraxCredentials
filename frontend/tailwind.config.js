/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#e11d48',
        'primary-dark': '#be123c',
        'primary-light': '#f43f5e',
        surface: '#0f1115',
        slate: {
          925: '#0a0c10',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 80px rgba(225, 29, 72, 0.25)',
      },
    },
  },
  plugins: [],
};
