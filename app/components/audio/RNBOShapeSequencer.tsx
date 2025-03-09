"use client";
import { useEffect, useRef, useState } from "react";
import { Parameter } from "./types";
import { getOrCreateDevice } from "./RNBOCore";
import VolumeControl from "../ui/VolumeControl";
import ParameterSlider from "../ui/ParameterSlider";
import { useSequencer } from "../../context/SequencerProvider";

interface Props {
  onAngleChange?: (angle: number) => void;
  onNumCornersChange?: (numCorners: number) => void;
}

const RNBOShapeSequencer = ({ onAngleChange, onNumCornersChange }: Props) => {
  const { state, toggleEvent, setNote, setRnboDevice } = useSequencer();
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [, setIsLoaded] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("Initializing...");
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(
    null
  );

  useEffect(() => {
    async function setup() {
      try {
        const device = await getOrCreateDevice(setDeviceStatus);
        if (!device) {
          setDeviceStatus("Failed to create RNBO device");
          return;
        }
        setRnboDevice(device);

        // Initialize numCorners value
        if (onNumCornersChange) {
          const numCornersParam = device.parameters.find(
            (p) => p.name === "numCorners"
          );
          if (numCornersParam) {
            onNumCornersChange(Math.round(numCornersParam.value));
          }
        }

        setParameters(device.parameters);
        setIsLoaded(true);
        setDeviceStatus("Ready - Click anywhere to start audio");

        // Subscribe to angle messages
        if (onAngleChange) {
          if (messageSubscriptionRef.current) {
            messageSubscriptionRef.current.unsubscribe();
          }

          messageSubscriptionRef.current = device.messageEvent.subscribe(
            (ev) => {
              if (ev.tag === "angle") {
                onAngleChange(ev.payload);
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

    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
        messageSubscriptionRef.current = null;
      }
    };
  }, [onAngleChange, onNumCornersChange]);

  const handleParameterChange = async (paramId: string, value: number) => {
    try {
      const device = await getOrCreateDevice(setDeviceStatus);
      if (!device) return;

      const param = device.parameters.find((p) => p.id === paramId);
      if (param) {
        // Round to integer for all parameters except speed
        if (param.name !== "speed") {
          value = Math.round(value);
        }

        param.value = value;

        // Propagate numCorners changes to the Scene component
        if (param.name === "numCorners" && onNumCornersChange) {
          onNumCornersChange(Math.round(value));
        }
      }
    } catch (err) {
      console.error("Error changing parameter:", err);
    }
  };

  // Custom renderer for specific parameters
  const renderParameter = (param: Parameter) => {
    if (param.name !== "speed") {
      // Create a modified parameter that enforces integer values
      const integerParam: Parameter = {
        ...param,
        value: Math.round(param.value),
        steps: param.max - param.min + 1,
      };

      return (
        <ParameterSlider
          key={param.id}
          param={integerParam}
          onChange={(id, value) => handleParameterChange(id, Math.round(value))}
        />
      );
    }

    return (
      <ParameterSlider
        key={param.id}
        param={param}
        onChange={handleParameterChange}
      />
    );
  };

  return (
    <div className="p-4 border rounded-md bg-[#3d3d3d] text-white">
      <h2 className="text-xl font-semibold mb-2">RNBO Device</h2>
      <p className="text-sm text-gray-300 mb-4">{deviceStatus}</p>

      <VolumeControl />

      <div className="space-y-4">
        <h3 className="font-medium">Parameters</h3>
        {parameters.length === 0 ? (
          <em className="text-gray-400">No parameters available</em>
        ) : (
          <div className="space-y-3">{parameters.map(renderParameter)}</div>
        )}
      </div>
    </div>
  );
};

export default RNBOShapeSequencer;
