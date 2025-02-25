"use client";

import { useEffect, useRef, useState } from "react";
import { createDevice, IPatcher, MessageEvent } from "@rnbo/js";

// Define a type for the RNBO device based on its API
interface RNBODeviceType {
  node: AudioNode;
  parameters: Parameter[];
  messageEvent: {
    subscribe: (callback: (ev: MessageEvent) => void) => {
      unsubscribe: () => void;
    };
  };
  [key: string]: any;
}

// Define a type for our parameters
interface Parameter {
  id: string;
  name: string;
  min: number;
  max: number;
  steps: number;
  value: number;
}

interface Props {
  onAngleChange?: (angle: number) => void;
}

// Create a singleton AudioContext to ensure we only ever have one
let globalAudioContext: AudioContext | null = null;
let globalDeviceSetup: Promise<RNBODeviceType | null> | null = null;
let globalCleanupFn: (() => void) | null = null;
let globalMasterGain: GainNode | null = null;

const RNBODevice = ({ onAngleChange }: Props) => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [, setIsLoaded] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("Initializing...");
  const [volume, setVolume] = useState(0.8); // Default volume at 80%
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(
    null
  );

  // Get or create AudioContext and master volume node
  const getOrCreateAudioContext = () => {
    if (!globalAudioContext) {
      globalAudioContext = new AudioContext();
      globalMasterGain = globalAudioContext.createGain();
      globalMasterGain.connect(globalAudioContext.destination);
      globalMasterGain.gain.value = volume;
    }
    return globalAudioContext;
  };

  // Update volume when slider changes
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (globalMasterGain) {
      globalMasterGain.gain.value = newVolume;
    }
  };

  useEffect(() => {
    // Setup function that will only be called once
    async function getOrCreateDevice() {
      // If we already have a setup in progress, return that
      if (globalDeviceSetup) {
        return globalDeviceSetup;
      }

      // Create a new setup promise
      globalDeviceSetup = (async () => {
        try {
          setDeviceStatus("Creating audio context...");
          const audioContext = getOrCreateAudioContext();

          // Make sure the audio context is running
          if (audioContext.state !== "running") {
            setDeviceStatus(
              "Audio context suspended. Click anywhere to resume."
            );

            // Setup click handler to resume audio context
            const resumeAudioContext = () => {
              audioContext.resume().then(() => {
                document.removeEventListener("click", resumeAudioContext);
              });
            };

            document.addEventListener("click", resumeAudioContext);
          }

          setDeviceStatus("Loading RNBO patcher...");
          const response = await fetch("/spinShapeSeq.export.json");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const patcher: IPatcher = await response.json();

          setDeviceStatus("Creating RNBO device...");
          const device = await createDevice({
            context: audioContext,
            patcher,
          });

          // Connect to master gain instead of directly to destination
          setDeviceStatus("Connecting RNBO device to audio output...");
          if (globalMasterGain) {
            device.node.connect(globalMasterGain);
          }

          return device;
        } catch (err) {
          console.error("Error in RNBO setup:", err);
          setDeviceStatus(
            `Error: ${err instanceof Error ? err.message : String(err)}`
          );
          // Reset the global setup so we can try again
          globalDeviceSetup = null;
          return null;
        }
      })();

      return globalDeviceSetup;
    }

    // Main setup function for this component instance
    async function setup() {
      try {
        // Get or create the global device
        const device = await getOrCreateDevice();
        if (!device) {
          setDeviceStatus("Failed to create RNBO device");
          return;
        }

        // Update parameters state
        setParameters(device.parameters);
        setIsLoaded(true);
        setDeviceStatus("Ready - Click anywhere to start audio");

        // Subscribe to message events
        if (onAngleChange) {
          // Clean up previous subscription if it exists
          if (messageSubscriptionRef.current) {
            messageSubscriptionRef.current.unsubscribe();
          }

          // Create new subscription
          messageSubscriptionRef.current = device.messageEvent.subscribe(
            (ev: MessageEvent) => {
              if (ev.tag === "angle") {
                // Check if the value is a number or in an array
                const angleValue = Array.isArray(ev.payload)
                  ? ev.payload[0]
                  : ev.payload;

                if (typeof angleValue === "number") {
                  onAngleChange(angleValue);
                }
              }
            }
          );

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
        }
      } catch (err) {
        console.error("Error in component setup:", err);
        setDeviceStatus(
          `Error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    setup();

    // Component cleanup
    return () => {
      // Only unsubscribe from messages, don't destroy the device
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
        messageSubscriptionRef.current = null;
      }
    };
  }, [onAngleChange]); // Only re-run if onAngleChange changes

  const handleParameterChange = async (paramId: string, value: number) => {
    try {
      const device = await globalDeviceSetup;
      if (!device) return;

      // Find the parameter and update its value
      const param = device.parameters.find((p: Parameter) => p.id === paramId);
      if (param) {
        param.value = value;
      }
    } catch (err) {
      console.error("Error changing parameter:", err);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold mb-2">RNBO Audio Engine</h2>
      <p className="text-sm text-gray-600 mb-4">{deviceStatus}</p>

      {/* Master Volume Control */}
      <div className="mb-6">
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
          <label className="text-sm font-medium">Master Volume:</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-sm">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Parameters</h3>
        {parameters.length === 0 ? (
          <em className="text-gray-500">No parameters available</em>
        ) : (
          <div className="space-y-3">
            {parameters.map((param) => (
              <div
                key={param.id}
                className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center"
              >
                <label className="text-sm">{param.name}: </label>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={
                    param.steps > 1
                      ? (param.max - param.min) / (param.steps - 1)
                      : 0.001
                  }
                  defaultValue={param.value}
                  onChange={(e) =>
                    handleParameterChange(param.id, parseFloat(e.target.value))
                  }
                  className="w-full"
                />
                <input
                  type="number"
                  value={param.value}
                  onChange={(e) =>
                    handleParameterChange(param.id, parseFloat(e.target.value))
                  }
                  min={param.min}
                  max={param.max}
                  step={
                    param.steps > 1
                      ? (param.max - param.min) / (param.steps - 1)
                      : 0.001
                  }
                  className="w-16 px-1 py-0.5 border rounded"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Clean up resources when the page unloads
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (globalCleanupFn) {
      globalCleanupFn();
    }
  });
}

export default RNBODevice;
