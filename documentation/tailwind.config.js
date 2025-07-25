/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,css,svg,mdx}",
    "./docs/**/*.{js,jsx,ts,tsx,css,svg,mdx}",
    "./docusaurus.config.ts",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5715" }],
        base: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.017em" }],
        lg: ["1.125rem", { lineHeight: "1.5", letterSpacing: "-0.017em" }],
        xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.017em" }],
        "2xl": ["1.5rem", { lineHeight: "1.415", letterSpacing: "-0.017em" }],
        "3xl": ["1.875rem", { lineHeight: "1.333", letterSpacing: "-0.017em" }],
        "4xl": ["2.25rem", { lineHeight: "1.277", letterSpacing: "-0.017em" }],
        "5xl": ["2.75rem", { lineHeight: "1.2", letterSpacing: "-0.017em" }],
        "6xl": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.017em" }],
        "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.017em" }],
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
        normal: "0",
        wide: "0.01em",
        wider: "0.02em",
        widest: "0.4em",
      },
      animation: {
        endless: "endless 20s linear infinite",
        shine: "shine var(--duration) infinite linear",
        rainbow: "rainbow var(--speed, 2s) infinite linear",
        "shiny-text": "shiny-text 8s infinite",
        move: "move 5s linear infinite",
        ripple: "ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite",
      },
      keyframes: {
        move: {
          "0%": {
            transform: "translateX(-200px)",
          },
          "100%": {
            transform: "translateX(200px)",
          },
        },
        endless: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-245px)" },
        },
        rainbow: {
          "0%": { "background-position": "0%" },
          "100%": { "background-position": "200%" },
        },
        shine: {
          "0%": {
            "background-position": "0% 0%",
          },
          "50%": {
            "background-position": "100% 100%",
          },
          to: {
            "background-position": "0% 0%",
          },
        },
        "shiny-text": {
          "0%, 90%, 100%": {
            "background-position": "calc(-100% - var(--shiny-width)) 0",
          },
          "30%, 60%": {
            "background-position": "calc(100% + var(--shiny-width)) 0",
          },
        },
        ripple: {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(0.9)",
          },
        },
      },
    },
  },
  plugins: [],
};
