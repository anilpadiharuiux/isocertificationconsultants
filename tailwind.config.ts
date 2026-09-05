import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cinematic near-black base ("noir")
        ink: {
          950: "#04060C",
          900: "#070B14",
          800: "#0B1120",
          700: "#101A2E",
          600: "#17233D",
          500: "#20304F",
        },
        navy: {
          DEFAULT: "#162B4D",
          50: "#f2f5fa",
          100: "#e2e9f3",
          200: "#c6d3e6",
          300: "#9bb2d1",
          400: "#6a89b6",
          500: "#47679b",
          600: "#365182",
          700: "#2c4169",
          800: "#243553",
          900: "#162B4D",
          950: "#0d1a30",
        },
        // Bright cyan glow (evolved from brand teal)
        cyan: {
          DEFAULT: "#22D3EE",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891B2",
        },
        teal: {
          DEFAULT: "#0891B2",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#0891B2",
          600: "#0e7490",
          700: "#155e75",
        },
        // Premium gradient partner
        violet: {
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b7bff",
          600: "#7c6bff",
          700: "#6d28d9",
        },
        gold: {
          DEFAULT: "#F59E0B",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#D97706",
          700: "#b45309",
        },
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 0 1px rgba(34,211,238,0.18), 0 20px 60px -20px rgba(34,211,238,0.45)",
        "glow-violet": "0 0 0 1px rgba(139,123,255,0.18), 0 20px 60px -20px rgba(139,123,255,0.4)",
        "glow-gold": "0 12px 40px -12px rgba(245,158,11,0.55)",
        surface: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -30px rgba(0,0,0,0.85)",
        "surface-hover":
          "0 1px 0 0 rgba(255,255,255,0.1) inset, 0 30px 80px -30px rgba(0,0,0,0.9)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.1)" },
          "66%": { transform: "translate(-5%, 4%) scale(0.95)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        marquee: "marquee 45s linear infinite",
        "marquee-slow": "marquee 70s linear infinite",
        aurora: "aurora 20s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
