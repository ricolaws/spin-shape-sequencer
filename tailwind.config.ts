import type { Config } from "tailwindcss/types/config";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0036ff",
        secondary: "#282828",
        background: "#282828",
        foreground: "#ebebeb",
        polygon: "#4080bf",
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
