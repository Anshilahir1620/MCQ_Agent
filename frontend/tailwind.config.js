/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0a0a',
          surface: '#111111',
          card: '#161616',
          cardAlt: '#1a1a1a',
          border: 'rgba(255,255,255,0.08)',
          orange: '#f97316',
          orangeDark: '#ea580c',
          orangeLight: '#fb923c',
          muted: '#a3a3a3',
          mutedDark: '#737373',
          text: '#f5f5f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(249,115,22,0.25), 0 0 40px rgba(249,115,22,0.1)',
        'orange-glow-sm': '0 0 10px rgba(249,115,22,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'orange-radial': 'radial-gradient(ellipse at center, rgba(249,115,22,0.15) 0%, transparent 70%)',
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, #161616 0%, #111111 100%)',
      },
      animation: {
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(249,115,22,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(249,115,22,0.6)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
