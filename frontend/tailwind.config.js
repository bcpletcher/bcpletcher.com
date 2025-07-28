/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        font: {
          primary: "#ffffff",
          secondary: "#5EEAD4",
          tertiary: "#172a38",
        },
        gradient: {
          start: "#5EEAD4",
          end: "#8369D1",
        },
        base: {
          background: "#211f2c",
          sidebar: "#272636",
          border: "#313040",
        },
        gray: {
          0: "#ffffff",
          50: "#f9fafb",
          100: "#f0f1f3",
          200: "#d9dbdf",
          300: "#b7bbc2",
          400: "#8f959f",
          500: "#6e7582",
          600: "#555e6e",
          700: "#3e4859",
          800: "#283242",
          900: "#191f28",
          950: "#0e131a",
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
