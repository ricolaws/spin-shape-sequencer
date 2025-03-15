import { colors } from "../tailwind.config";

declare module "tailwindcss" {
  interface CustomTheme {
    colors: typeof colors;
  }

  // Extend the default Config type
  interface Config {
    theme?: {
      extend?: CustomTheme;
    };
  }
}
