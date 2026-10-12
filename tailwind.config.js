/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        ink: {
          700: '#1c2540',
          800: '#141b31',
          900: '#0d1324',
          950: '#080c18',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        lift: '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 12px 24px -6px rgba(15, 23, 42, 0.12)',
        glow: '0 8px 24px -6px rgba(79, 70, 229, 0.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)',
        'hero-gradient': 'linear-gradient(120deg, #312e81 0%, #4f46e5 30%, #7c3aed 55%, #a21caf 75%, #4f46e5 100%)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)', filter: 'blur(4px)' },
          to: { opacity: '1', transform: 'none', filter: 'none' },
        },
        sweep: { to: { transform: 'rotate(360deg)' } },
        gradient: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-30px, 20px) scale(0.95)' },
        },
        'grow-x': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        blip: { '0%, 100%': { opacity: '0.35', transform: 'scale(0.8)' }, '50%': { opacity: '1', transform: 'scale(1.3)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        sweep: 'sweep 4s linear infinite',
        gradient: 'gradient 12s ease infinite',
        float: 'float 4s ease-in-out infinite',
        drift: 'drift 20s ease-in-out infinite',
        'grow-x': 'grow-x 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        blip: 'blip 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
