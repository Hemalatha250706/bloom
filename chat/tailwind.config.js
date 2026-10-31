/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bloom: {
          green: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            text: '#064E3B',
          },
          cream: {
            50: '#FFFEFA',
            100: '#FDFBF7',
            200: '#F7F3EA',
            300: '#EFE7D8',
            400: '#E2D5BE',
          },
          lavender: {
            50: '#F5F3FF',
            100: '#EDE9FE',
            200: '#DDD6FE',
            300: '#C4B5FD',
            400: '#A78BFA',
            500: '#8B5CF6',
            text: '#4C1D95',
          },
          blue: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0EA5E9',
            text: '#0369A1',
          },
          peach: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            text: '#9A3412',
          },
          rose: {
            50: '#FFF1F2',
            100: '#FFE4E6',
            200: '#FECDD3',
            300: '#FDA4AF',
            400: '#FB7185',
            500: '#F43F5E',
          },
        },
        // Backwards compatibility with previous classes
        pastel: {
          green: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            text: '#064E3B',
          },
          cream: {
            50: '#FFFEFA',
            100: '#FDFBF7',
            200: '#F7F3EA',
            300: '#EFE7D8',
            400: '#E2D5BE',
          },
          lavender: {
            50: '#F5F3FF',
            100: '#EDE9FE',
            200: '#DDD6FE',
            300: '#C4B5FD',
            text: '#4C1D95',
          },
          blue: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            text: '#0369A1',
          },
          peach: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            text: '#9A3412',
          },
          rose: {
            50: '#FFF1F2',
            100: '#FFE4E6',
            200: '#FECDD3',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'card': '0 20px 40px -15px rgba(16, 185, 129, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
        'glow-green': '0 8px 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-purple': '0 8px 24px -4px rgba(167, 139, 250, 0.35)',
        'glow-peach': '0 8px 24px -4px rgba(251, 146, 60, 0.35)',
      },
    },
  },
  plugins: [],
}
