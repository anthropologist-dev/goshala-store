import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#FBF6EC", dark: "#F3EADA" },
        leaf: { DEFAULT: "#2E4B2C", light: "#46703F", dark: "#1F331E" },
        saffron: { DEFAULT: "#C9762C", light: "#E39A4F" },
        earth: { DEFAULT: "#5B4331", light: "#8A6E57" },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Mulish", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
