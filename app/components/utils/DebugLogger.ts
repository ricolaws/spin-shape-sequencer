// Simple debug mode flag
let DEBUG_MODE = false;

// Logger utility that checks debug mode
export const logger = {
  log: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors regardless of debug mode
    console.error(...args);
  },
  // Method to toggle debug mode
  setDebugMode: (enabled: boolean) => {
    DEBUG_MODE = enabled;
    if (enabled) {
      console.log("Debug mode enabled");
    } else {
      console.log("Debug mode disabled");
    }
  },
  // Method to get current debug mode
  isDebugMode: () => DEBUG_MODE,
};
