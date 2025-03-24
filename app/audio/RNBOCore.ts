import { RNBODeviceType } from "./types";
import { createDevice } from "@rnbo/js";

// Singleton state for audio resources
let globalAudioContext: AudioContext | null = null;
let globalDeviceSetup: Promise<RNBODeviceType | null> | null = null;
let globalCleanupFn: (() => void) | null = null;
let globalMasterGain: GainNode | null = null;

// Get or create the AudioContext
export function getOrCreateAudioContext() {
  if (!globalAudioContext) {
    globalAudioContext = new AudioContext();
    globalMasterGain = globalAudioContext.createGain();
    globalMasterGain.connect(globalAudioContext.destination);
    globalMasterGain.gain.value = 0.8; // Default volume
  }
  return globalAudioContext;
}

// Set master volume
export function setMasterVolume(volume: number) {
  if (globalMasterGain) {
    globalMasterGain.gain.value = volume;
  }
}

// Get master volume
export function getMasterVolume(): number {
  return globalMasterGain?.gain.value ?? 0.8;
}

// Get or create the RNBO device
export async function getOrCreateDevice(
  onStatusChange: (status: string) => void
): Promise<RNBODeviceType | null> {
  // If we already have a setup in progress, return that
  if (globalDeviceSetup) {
    return globalDeviceSetup;
  }

  // Create a new setup promise
  globalDeviceSetup = (async () => {
    try {
      onStatusChange("Creating audio context...");
      const audioContext = getOrCreateAudioContext();

      // Make sure the audio context is running
      if (audioContext.state !== "running") {
        onStatusChange("Audio context suspended. Click anywhere to resume.");

        // Setup click handler to resume audio context
        const resumeAudioContext = () => {
          audioContext.resume().then(() => {
            document.removeEventListener("click", resumeAudioContext);
          });
        };

        document.addEventListener("click", resumeAudioContext);
      }

      onStatusChange("Loading RNBO patcher...");
      const response = await fetch("/spinShapeSeq2.export.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const patcher = await response.json();

      onStatusChange("Creating RNBO device...");
      const device = await createDevice({
        context: audioContext,
        patcher,
      });

      // Connect to master gain instead of directly to destination
      onStatusChange("Connecting RNBO device to audio output...");
      if (globalMasterGain) {
        device.node.connect(globalMasterGain);
      }

      // Set up global cleanup function if not already set
      if (!globalCleanupFn) {
        globalCleanupFn = () => {
          if (device) {
            device.node.disconnect();
          }
          if (globalAudioContext) {
            globalAudioContext.close();
            globalAudioContext = null;
          }
          if (globalMasterGain) {
            globalMasterGain = null;
          }
          globalDeviceSetup = null;
        };
      }

      return device;
    } catch (err) {
      console.error("Error in RNBO setup:", err);
      onStatusChange(
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
      // Reset the global setup so we can try again
      globalDeviceSetup = null;
      return null;
    }
  })();

  return globalDeviceSetup;
}

// Clean up resources
export function cleanup() {
  if (globalCleanupFn) {
    globalCleanupFn();
  }
}

// Register cleanup handler for page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanup);
}
