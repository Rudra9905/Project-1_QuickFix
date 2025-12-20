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
          DEFAULT: '#5B21B6', // Deep violet
          50: '#EDE9FE',
          100: '#DDD6FE',
          200: '#C4B5FD',
          300: '#A78BFA',
          400: '#8B5CF6',
          500: '#7C3AED', // Bright purple-blue (Accent)
          600: '#6366F1', // Electric indigo (Hover/Active)
          700: '#5B21B6', // Deep violet (Primary)
          800: '#4F46E5', // Deep indigo
          900: '#4338CA',
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
