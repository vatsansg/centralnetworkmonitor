/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // These reference CSS variables so all components theme-switch automatically.
        // Dark values are defined in :root; light values override via html:not(.dark).
        dark: {
          900: 'rgb(var(--c900) / <alpha-value>)',
          800: 'rgb(var(--c800) / <alpha-value>)',
          700: 'rgb(var(--c700) / <alpha-value>)',
          600: 'rgb(var(--c600) / <alpha-value>)',
          500: 'rgb(var(--c500) / <alpha-value>)',
          400: 'rgb(var(--c400) / <alpha-value>)',
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
