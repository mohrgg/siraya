import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'albas-green': 'var(--albas-green)',
        'albas-green-light': 'var(--albas-green-light)',
        'albas-yellow': 'var(--albas-yellow)',
        'albas-yellow-dark': 'var(--albas-yellow-dark)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        bg: 'var(--bg-color)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        sidebar: {
          bg: 'var(--sidebar-bg)',
          hover: 'var(--sidebar-hover)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border-color)',
      }
    },
  },
  plugins: [],
} satisfies Config

