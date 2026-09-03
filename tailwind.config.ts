import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom PG brand colors
        brand: {
          50:  'hsl(221, 100%, 97%)',
          100: 'hsl(221, 95%, 93%)',
          200: 'hsl(221, 90%, 85%)',
          300: 'hsl(221, 85%, 73%)',
          400: 'hsl(221, 80%, 58%)',
          500: 'hsl(221, 75%, 47%)',
          600: 'hsl(221, 80%, 40%)',
          700: 'hsl(221, 82%, 33%)',
          800: 'hsl(221, 85%, 26%)',
          900: 'hsl(221, 88%, 19%)',
          950: 'hsl(221, 90%, 12%)',
        },
        saffron: {
          DEFAULT: 'hsl(28, 100%, 54%)',
          light: 'hsl(38, 100%, 68%)',
          dark: 'hsl(22, 92%, 42%)',
        },
        emerald: {
          DEFAULT: 'hsl(152, 68%, 44%)',
          light: 'hsl(152, 76%, 58%)',
          dark: 'hsl(152, 72%, 30%)',
        },
        // Status colors
        status: {
          available: 'hsl(152, 68%, 44%)',
          occupied: 'hsl(221, 75%, 47%)',
          partial: 'hsl(38, 100%, 54%)',
          maintenance: 'hsl(0, 0%, 60%)',
          reserved: 'hsl(280, 70%, 55%)',
          overdue: 'hsl(0, 80%, 54%)',
          paid: 'hsl(152, 68%, 44%)',
          pending: 'hsl(38, 100%, 54%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px hsla(221, 75%, 47%, 0.3)' },
          '50%': { boxShadow: '0 0 40px hsla(221, 75%, 47%, 0.6)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'count-up': 'count-up 0.5s ease-out',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.10)',
        'glow': '0 0 30px hsla(221, 75%, 47%, 0.25)',
        'glow-sm': '0 0 15px hsla(221, 75%, 47%, 0.15)',
        'inner-sm': 'inset 0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
