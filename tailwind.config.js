/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
        colors:{
          'bg-base':   '#0B0F19',
          'bg-card':   '#111827',
          'bg-input':  '#1A1F33',
          'border':    '#374151',
          'primary':   '#6366F1',
          'primary-light': '#A5B4FC',
          'text-main': '#FFFFFF',
          'text-sub':  '#9CA3AF',
          'text-soft': '#E5E7EB',
          'icon-muted':'#C7C9FF',
          'success':   '#22C55E'
        },
        fontFamily:{
          sans:  ['Inter', 'system-ui', 'sans-serif'],
        tight: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        },
    },
  },
  plugins: [],
}

