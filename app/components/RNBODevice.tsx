"use client";

import { useEffect, useRef, useState } from "react";
import { createDevice, IPatcher, MessageEvent } from "@rnbo/js";

// Define a type for the RNBO device based on its API
interface RNBODeviceType {
  node: AudioNode;
  parameters: Parameter[];
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

const RNBODevice = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const deviceRef = useRef<RNBODeviceType | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [, setIsLoaded] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        // Create standard AudioContext
        audioContextRef.current = new AudioContext();

        // Create output node and connect to speakers
        const outputNode = audioContextRef.current.createGain();
        outputNode.connect(audioContextRef.current.destination);

        // Fetch the RNBO patcher configuration
        const response = await fetch("/spinShapeSeq.export.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the patcher configuration
        const patcher: IPatcher = await response.json();

        // Create the RNBO device using the imported createDevice function
        const device = await createDevice({
          context: audioContextRef.current,
          patcher,
        });

        // Store the device and connect it to the output
        deviceRef.current = device;
        device.node.connect(outputNode);

        // Get parameters from device
        setParameters(device.parameters);
        setIsLoaded(true);

        // Enable audio context on user interaction (required by most browsers)
        document.body.onclick = () => {
          audioContextRef.current?.resume();
        };

        console.log("RNBO device setup complete");
      } catch (err) {
        console.error("Error in RNBO setup:", err);
      }
    }

    setup();

    // Cleanup function
    return () => {
      if (deviceRef.current) {
        deviceRef.current.node.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleParameterChange = (paramId: string, value: number) => {
    if (!deviceRef.current) return;

    // Find the parameter and update its value
    const param = deviceRef.current.parameters.find(
      (p: Parameter) => p.id === paramId
    );
    if (param) {
      param.value = value;
    }
  };

  return (
    <div>
      <h1>RNBO Device</h1>
      <p>Click anywhere to start audio</p>

      <div id="rnbo-console">
        <div id="rnbo-parameter-sliders">
          <h2>Parameters</h2>
          {parameters.length === 0 ? (
            <em id="no-param-label">No parameters</em>
          ) : (
            parameters.map((param) => (
              <div key={param.id} className="parameter-container">
                <label>{param.name}: </label>
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
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RNBODevice;
