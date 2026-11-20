/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#080d18',
        panel: '#0e1727',
        panel2: '#121f32',
        line: '#1d2c42',
        mint: '#55e6b0',
        cyan: '#5dd6ef',
        amber: '#f5b84b',
        danger: '#ff6b7d',
      },
      boxShadow: {
        glow: '0 0 28px rgba(85,230,176,.12)',
        panel: '0 16px 44px rgba(0,0,0,.22)',
      },
      backgroundImage: {
        'grid-soft': 'linear-gradient(rgba(105,145,180,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(105,145,180,.055) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
