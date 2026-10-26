/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF8F4',
        surface: '#FFFFFF',
        'surface-subtle': '#F3F0E9',
        border: '#E5E0D7',
        'border-strong': '#D1CAC0',
        text: {
          primary: '#20201D',
          secondary: '#69675F',
          tertiary: '#89867E',
        },
        forecast: '#D95635',       // Vermilion line & badges
        actual: '#252622',         // Ink black line & badges
        underforecast: '#267568',  // Deep teal
        overforecast: '#A96E13',   // Amber/warm brown
        baseline: '#7C7971',       // Gray for persistence baseline
        success: '#267568',
        warning: '#A96E13',
        danger: '#B74335',
        'focus-ring': '#6B7F59',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(32, 32, 29, 0.05), 0 1px 2px 0 rgba(32, 32, 29, 0.03)',
        card: '0 2px 4px 0 rgba(32, 32, 29, 0.04), 0 1px 2px 0 rgba(32, 32, 29, 0.02)',
      }
    },
  },
  plugins: [],
}
