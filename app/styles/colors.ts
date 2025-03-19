// ** also update in tailwind.config.ts :( **
export const colors = {
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
} as const;

export type ColorKey = keyof typeof colors;
export type MarkerColorKey = keyof typeof colors.marker;
