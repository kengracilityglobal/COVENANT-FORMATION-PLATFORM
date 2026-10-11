// @ts-nocheck
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EIKON brand palette
        gold: {
          DEFAULT: '#B8972A',
          light: '#D4AA4A',
          pale: '#FBF6EC',
          muted: '#8A7340',
        },
        brown: {
          deep: '#3B2F1E',
          warm: '#4A3F2F',
          dark: '#2A1F0E',
        },
        parchment: {
          DEFAULT: '#F9F7F2',
          warm: '#F5E6C0',
        },
        eikon: {
          bg: '#0D0B08',
          surface: '#1A1510',
          border: '#2A2218',
          muted: '#3D3325',
        },
        formation: {
          christformed: '#2C5F2E',
          rooted: '#4A7A4A',
          growing: '#B8972A',
          awakening: '#C47A1A',
          unengaged: '#8B2020',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #B8972A 0%, #D4AA4A 50%, #B8972A 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0D0B08 0%, #1A1510 100%)',
        'surface-gradient': 'linear-gradient(135deg, #1A1510 0%, #2A2218 100%)',
        'parchment-texture': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      },
      boxShadow: {
        'gold-sm': '0 0 0 1px rgba(184, 151, 42, 0.2)',
        'gold-md': '0 0 0 1px rgba(184, 151, 42, 0.3), 0 4px 24px rgba(184, 151, 42, 0.08)',
        'gold-lg': '0 0 0 1px rgba(184, 151, 42, 0.4), 0 8px 48px rgba(184, 151, 42, 0.12)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.2)',
        'card-hover': '0 2px 6px rgba(0,0,0,0.5), 0 12px 48px rgba(0,0,0,0.3)',
      },
      borderColor: {
        DEFAULT: '#2A2218',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'radar-draw': 'radarDraw 1.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 151, 42, 0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(184, 151, 42, 0.15)' },
        },
        radarDraw: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      transitionTimingFunction: {
        'formation': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}

export default config
