import type { Config } from "tailwindcss/types/config";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ff4500",
        secondary: "#282828",
        background: "#c1c1c1",
        foreground: "#ebebeb",
        polygon: "#dbdbdb",
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
