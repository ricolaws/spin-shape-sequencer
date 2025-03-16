// ** also update in tailwind.config.ts :( **
export const colors = {
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
} as const;

export type ColorKey = keyof typeof colors;
export type MarkerColorKey = keyof typeof colors.marker;
