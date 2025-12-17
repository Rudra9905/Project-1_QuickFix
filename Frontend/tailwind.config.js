/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4C0FA8', // Deep royal purple
          50: '#F1EAFE',
          100: '#E1D4FF',
          200: '#C7B1FF',
          300: '#A57FF2',
          400: '#8C5BE6',
          500: '#7F5FF0', // Accent Purple (Selections)
          600: '#6432C4', // Hover / Active Purple
          700: '#4C0FA8', // Deep Purple / Indigo
          800: '#3B0C82',
          900: '#2C0A68',
        },
        text: {
          primary: '#0F172A', // Primary Text (Headings)
          secondary: '#4B5563', // Secondary Text (Descriptions)
          muted: '#94A3B8', // Muted Text (Helper labels)
        },
        background: {
          app: '#F7F7FB', // App Background (soft neutral)
          card: '#FFFFFF', // Card Background
          DEFAULT: '#F7F7FB',
        },
        border: {
          DEFAULT: '#E5E7EB', // Divider / Border
          muted: '#94A3B8',
        },
        success: {
          DEFAULT: '#00B76B',
        },
        warning: {
          DEFAULT: '#FF9D2B',
        },
        error: {
          DEFAULT: '#DC2626',
        },
        info: {
          DEFAULT: '#00B6D8',
        },
        accent: {
          teal: '#00B6D8',
          orange: '#FF9D2B',
          navy: '#102A66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0px 8px 24px rgba(0, 0, 0, 0.06)',
        'medium': '0px 12px 32px rgba(0, 0, 0, 0.08)',
        'large': '0px 16px 40px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
