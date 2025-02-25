"use client";

import { useEffect, useRef, useState } from "react";
import { Parameter } from "./types";
import { getOrCreateDevice } from "./RNBOCore";
import VolumeControl from "../ui/VolumeControl";
import ParameterSlider from "../ui/ParameterSlider";

interface Props {
  onAngleChange?: (angle: number) => void;
}

const RNBODevice = ({ onAngleChange }: Props) => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [, setIsLoaded] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("Initializing...");
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(
    null
  );

  useEffect(() => {
    // Main setup function for this component instance
    async function setup() {
      try {
        // Get or create the global device
        const device = await getOrCreateDevice(setDeviceStatus);
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
            (ev) => {
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
      const device = await getOrCreateDevice(setDeviceStatus);
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
    <div className="p-4 border rounded-md bg-[#3d3d3d] text-white">
      <h2 className="text-xl font-semibold mb-2">RNBO Device</h2>
      <p className="text-sm text-gray-300 mb-4">{deviceStatus}</p>

      {/* Master Volume Control */}
      <VolumeControl />

      <div className="space-y-4">
        <h3 className="font-medium">Parameters</h3>
        {parameters.length === 0 ? (
          <em className="text-gray-400">No parameters available</em>
        ) : (
          <div className="space-y-3">
            {parameters.map((param) => (
              <ParameterSlider
                key={param.id}
                param={param}
                onChange={handleParameterChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RNBODevice;
