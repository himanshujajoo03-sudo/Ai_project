/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        critical: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
          border: '#FECACA',
          dark: '#991B1B',
        },
        high: {
          DEFAULT: '#EA580C',
          light: '#FFF7ED',
          border: '#FED7AA',
          dark: '#9A3412',
        },
        medium: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
          border: '#FDE68A',
          dark: '#92400E',
        },
        low: {
          DEFAULT: '#16A34A',
          light: '#F0FDF4',
          border: '#BBF7D0',
          dark: '#166534',
        },
        operational: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
          border: '#BFDBFE',
          dark: '#1E40AF',
        },
      },
    },
  },
  plugins: [],
}
