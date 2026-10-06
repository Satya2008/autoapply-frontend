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
        'hero-gradient': 'radial-gradient(1200px 300px at 0% 0%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(120deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        sweep: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'fade-up': 'fade-up 0.25s ease-out both',
        sweep: 'sweep 4s linear infinite',
      },
    },
  },
  plugins: [],
};
