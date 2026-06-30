/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151e35',
          600: '#1c2844',
          500: '#243058',
          400: '#2d3d6e',
        },
        accent: {
          blue:   '#3b82f6',
          cyan:   '#06b6d4',
          green:  '#22c55e',
          yellow: '#eab308',
          red:    '#ef4444',
          orange: '#f97316',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
