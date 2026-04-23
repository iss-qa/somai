import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', lg: '2rem' },
      screens: { '2xl': '1320px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8B5CF6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
          DEFAULT: '#8B5CF6',
        },
        accent: {
          cyan: '#22d3ee',
          fuchsia: '#e879f9',
          lime: '#a3e635',
        },
        brand: {
          dark: '#07070c',
          card: '#111119',
          border: '#1e1e2e',
          muted: '#71717a',
          surface: '#18181f',
        },
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'radial-violet':
          'radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0) 60%)',
        'hero-glow':
          'radial-gradient(60% 50% at 50% 40%, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 70%)',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(139,92,246,0.5)',
        'glow-lg': '0 0 80px -10px rgba(139,92,246,0.55)',
        card: '0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 60px -30px rgba(0,0,0,0.6)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        panelSlideRight: {
          from: { opacity: '0', transform: 'translateX(40px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        panelSlideLeft: {
          from: { opacity: '0', transform: 'translateX(-40px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        formFadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        dialogIn: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(calc(-50% + 8px))' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(-50%)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        slideUp: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'dialog-in': 'dialogIn 0.2s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        pulseRing: 'pulseRing 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'panel-slide-right': 'panelSlideRight 0.5s cubic-bezier(0.16,1,0.3,1)',
        'panel-slide-left': 'panelSlideLeft 0.5s cubic-bezier(0.16,1,0.3,1)',
        'form-fade-in': 'formFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both',
      },
    },
  },
  plugins: [],
}
export default config
