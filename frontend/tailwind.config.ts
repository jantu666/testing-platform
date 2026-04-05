import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        forum: {
          bg: '#0f1419',
          card: '#1a2332',
          border: '#2d3a4f',
          muted: '#8b9cb3',
          accent: '#3b82f6',
          accentHover: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
