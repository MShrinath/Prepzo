/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          canvas: '#000000',
          base: '#0A0A0C',
          grouped: '#1C1C1E',
          card: 'rgba(255, 255, 255, 0.04)',
          cardHover: 'rgba(255, 255, 255, 0.07)',
          elevated: 'rgba(44, 44, 46, 0.85)',
          fill: 'rgba(120, 120, 128, 0.24)',
          separator: 'rgba(255, 255, 255, 0.08)',
          label: '#FFFFFF',
          secondary: '#98989D',
          tertiary: '#636366',
          blue: '#0A84FF',
          blueHover: '#0071E3',
          green: '#30D158',
          orange: '#FF9F0A',
          red: '#FF453A',
          indigo: '#5E5CE6',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        'apple-card': '0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'apple-modal': '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'apple-pill': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 2px 8px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
