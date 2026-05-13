/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        ink: "#1A1A1A",
        aurea: {
          50: "#F8F2E8",
          100: "#EFE2C9",
          200: "#E0CBA0",
          300: "#D0B377",
          400: "#C39E5C",
          500: "#B89968", // dorado principal
          600: "#9A7E54",
          700: "#7C6443",
          800: "#5D4B33",
          900: "#3E3222",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.25em",
      },
    },
  },
  plugins: [],
};
