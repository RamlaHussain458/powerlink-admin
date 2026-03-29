/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fb",
          400: "#36aaf5",
          500: "#0c8fe1",
          600: "#0070bf",
          700: "#01589a",
          800: "#064a7f",
          900: "#0b3f6a",
          950: "#072849",
        },
        surface: {
          DEFAULT: "#0f1117",
          card: "#161b27",
          border: "#1e2535",
          hover: "#1a2030",
        },
      },
      animation: {
        "fade-in": "fadeIn .25s ease both",
        "slide-in": "slideIn .3s ease both",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "none" },
        },
      },
    },
  },
  plugins: [],
};
