"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { Parameter } from "./types";
import { getOrCreateDevice } from "./RNBOCore";
import VolumeControl from "../ui/VolumeControl";
import ParameterSlider from "../ui/ParameterSlider";
import { useSequencer } from "../../context/SequencerProvider";

interface Props {
  onAngleChange?: (angle: number) => void;
  onNumCornersChange?: (numCorners: number) => void;
}

// Define the list of parameters to display and their order
const DISPLAY_PARAMETERS = [
  "speed",
  "numEvents",
  "numCorners",
  "noteLength",
  "Release",
  "partials",
  "tone",
  "balance",
];

// Define which parameters should use float values (all others use integers)
const FLOAT_PARAMETERS = ["speed", "tone", "balance"];

const RNBOShapeSequencer = ({ onAngleChange, onNumCornersChange }: Props) => {
  const {
    state,
    setRnboDevice,
    triggerEvent,
    setNumEvents,
    setNoteWindowOffset,
  } = useSequencer();
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [deviceStatus, setDeviceStatus] = useState("Initializing...");
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(
    null
  );
  const numEventsInitializedRef = useRef(false);

  // Store function references to prevent effect reruns
  const setRnboDeviceRef = useRef(setRnboDevice);
  const triggerEventRef = useRef(triggerEvent);
  const setNumEventsRef = useRef(setNumEvents);
  const setNoteWindowOffsetRef = useRef(setNoteWindowOffset);
  const onAngleChangeRef = useRef(onAngleChange);
  const onNumCornersChangeRef = useRef(onNumCornersChange);

  // Update refs when props change (without triggering effect reruns)
  useEffect(() => {
    onAngleChangeRef.current = onAngleChange;
    onNumCornersChangeRef.current = onNumCornersChange;
    setRnboDeviceRef.current = setRnboDevice;
    triggerEventRef.current = triggerEvent;
    setNumEventsRef.current = setNumEvents;
    setNoteWindowOffsetRef.current = setNoteWindowOffset;
  }, [
    onAngleChange,
    onNumCornersChange,
    setRnboDevice,
    triggerEvent,
    setNumEvents,
    setNoteWindowOffset,
  ]);

  useEffect(() => {
    async function setup() {
      try {
        const device = await getOrCreateDevice(setDeviceStatus);
        if (!device) {
          setDeviceStatus("Failed to create RNBO device");
          return;
        }

        // Use ref for setRnboDevice to avoid effect reruns
        if (setRnboDeviceRef.current) {
          setRnboDeviceRef.current(device);
        }

        // Initialize numCorners value
        if (onNumCornersChangeRef.current) {
          const numCornersParam = device.parameters.find(
            (p) => p.name === "numCorners"
          );
          if (numCornersParam) {
            onNumCornersChangeRef.current(Math.round(numCornersParam.value));
          }
        }

        // Initialize numEvents from RNBO device if it exists AND we haven't done it yet
        if (!numEventsInitializedRef.current) {
          const numEventsParam = device.parameters.find(
            (p) => p.name === "numEvents"
          );
          if (numEventsParam && typeof setNumEventsRef.current === "function") {
            setNumEventsRef.current(Math.round(numEventsParam.value));
            numEventsInitializedRef.current = true; // Mark as initialized
          }
        }

        // Send initial start_index of 0
        if (typeof setNoteWindowOffsetRef.current === "function") {
          setNoteWindowOffsetRef.current(0);
        }

        // Filter parameters to only include those in DISPLAY_PARAMETERS list
        const filteredParams = device.parameters.filter((p) =>
          DISPLAY_PARAMETERS.includes(p.name)
        );

        // Sort parameters according to the order in DISPLAY_PARAMETERS
        const sortedParams = [...filteredParams].sort((a, b) => {
          return (
            DISPLAY_PARAMETERS.indexOf(a.name) -
            DISPLAY_PARAMETERS.indexOf(b.name)
          );
        });

        setParameters(sortedParams);
        setDeviceStatus("Ready - Click anywhere to start audio");

        // Subscribe to messages from RNBO device
        if (messageSubscriptionRef.current) {
          messageSubscriptionRef.current.unsubscribe();
        }

        messageSubscriptionRef.current = device.messageEvent.subscribe((ev) => {
          // Handle angle messages
          if (ev.tag === "angle") {
            if (onAngleChangeRef.current) onAngleChangeRef.current(ev.payload);
          } else if (ev.tag === "trigger") {
            // The eventIndex is already adjusted by the RNBO device to account for the start_index
            const eventIndex = ev.payload;

            // Trigger the event through the context
            if (typeof triggerEventRef.current === "function") {
              triggerEventRef.current(eventIndex);
            }
          }
        });
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
  }, []); // Empty dependency array - setup runs only once

  const handleParameterChange = async (paramId: string, value: number) => {
    try {
      const device = await getOrCreateDevice(setDeviceStatus);
      if (!device) return;

      const param = device.parameters.find((p) => p.id === paramId);
      if (param) {
        // Round to integer for parameters not in FLOAT_PARAMETERS
        const shouldUseFloat = FLOAT_PARAMETERS.includes(param.name);
        if (!shouldUseFloat) {
          value = Math.round(value);
        }

        // Set the value in the RNBO device
        param.value = value;

        // Special handling for specific parameters
        if (param.name === "numCorners" && onNumCornersChangeRef.current) {
          onNumCornersChangeRef.current(Math.round(value));
        }

        // Handle numEvents parameter
        if (
          param.name === "numEvents" &&
          typeof setNumEventsRef.current === "function"
        ) {
          // We don't need to sync to RNBO since the slider already did that
          setNumEventsRef.current(Math.round(value));

          // When numEvents changes, we need to ensure the window offset is still valid
          // If the window offset would cause events to go out of bounds, adjust it
          const device = await getOrCreateDevice(setDeviceStatus);
          if (device && typeof setNoteWindowOffsetRef.current === "function") {
            const maxOffset =
              device.parameters.find((p) => p.name === "numEvents")?.value || 0;
            if (maxOffset > 0) {
              // Check and possibly adjust the window offset
              setNoteWindowOffsetRef.current(state.noteWindowOffset);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error changing parameter:", err);
    }
  };

  // Memoize parameter rendering to prevent recreating render functions on each component render
  const memoizedParameters = useMemo(() => {
    return parameters.map((param) => {
      const shouldUseFloat = FLOAT_PARAMETERS.includes(param.name);

      if (!shouldUseFloat) {
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
            onChange={(id, value) =>
              handleParameterChange(id, Math.round(value))
            }
          />
        );
      }

      // Float parameters use the original parameter configuration
      return (
        <ParameterSlider
          key={param.id}
          param={param}
          onChange={handleParameterChange}
        />
      );
    });
  }, [parameters, state.noteWindowOffset]);

  return (
    <div className="p-4 border rounded-md bg-[#282828] text-white">
      <h2 className="text-xl font-semibold mb-2">RNBO Device</h2>
      <p className="text-sm text-gray-300 mb-4">{deviceStatus}</p>
      <VolumeControl />
      <div className="space-y-4">
        <h3 className="font-medium">Parameters</h3>
        {parameters.length === 0 ? (
          <em className="text-gray-400">No parameters available</em>
        ) : (
          <div className="space-y-3">{memoizedParameters}</div>
        )}
      </div>
    </div>
  );
};

export default RNBOShapeSequencer;
