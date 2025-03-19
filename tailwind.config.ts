import type { Config } from "tailwindcss/types/config";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0036ff",
        secondary: "#06D6A0",
        background: "#343434",
        foreground: "#FFFCF9",
        polygon: "#98958D",
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
