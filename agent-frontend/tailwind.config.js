/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Custom colors for futuristic dark theme
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'dark-accent': '#8b5cf6', // Purple
        'dark-highlight': '#4f46e5', // Indigo
        'dark-text': '#f8fafc',
        'dark-text-muted': '#94a3b8',
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.purple.500"), 0 0 20px theme("colors.purple.600")',
        'neon-strong': '0 0 10px theme("colors.purple.500"), 0 0 30px theme("colors.purple.600"), 0 0 50px theme("colors.purple.700")',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px theme("colors.purple.500"), 0 0 10px theme("colors.purple.600")' },
          '100%': { boxShadow: '0 0 10px theme("colors.purple.500"), 0 0 20px theme("colors.purple.600"), 0 0 30px theme("colors.purple.700")' },
        }
      },
    },
  },
  plugins: [],
}