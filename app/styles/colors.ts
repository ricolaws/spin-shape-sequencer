// ** also update in tailwind.config.ts :( **
export const colors = {
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
} as const;

export type ColorKey = keyof typeof colors;
export type MarkerColorKey = keyof typeof colors.marker;
