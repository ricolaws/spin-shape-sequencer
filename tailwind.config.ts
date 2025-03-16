import type { Config } from "tailwindcss/types/config";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0036ff",
        secondary: "#cdcdcd",
        background: "#282828",
        foreground: "#ebe8e8",
        polygon: "#ebddde",
        ring: "#ebebeb",
        marker: {
          active: "#ffffff",
          inactive: "#666666",
          trigger: "#ffaa00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
