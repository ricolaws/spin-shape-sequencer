"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { Parameter } from "./types";
import { getOrCreateDevice } from "./RNBOCore";
import VolumeControl from "../ui/VolumeControl";
import ParameterSlider from "../ui/ParameterSlider";
import { useSequencer } from "../../context/SequencerProvider";
import { logger } from "../utils/DebugLogger";

interface Props {
  onAngleChange?: (angle: number) => void;
  onNumCorners_AChange?: (numCorners: number) => void;
  onNumCorners_BChange?: (numCorners: number) => void;
}

// Define the list of parameters to display and their order
const DISPLAY_PARAMETERS = [
  "speed",
  "numEvents_A",
  "numCorners_A",
  "numEvents_B",
  "numCorners_B",
  "noteLength",
  "Release",
  "partials",
  "balance",
];

// Define which parameters should use float values (all others use integers)
const FLOAT_PARAMETERS = ["speed", "balance"];

const RNBOShapeSequencer = ({
  onAngleChange,
  onNumCorners_AChange,
  onNumCorners_BChange,
}: Props) => {
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
  const numEventsInitializedRef = useRef({
    A: false,
    B: false,
  });

  // Store function references to prevent effect reruns
  const setRnboDeviceRef = useRef(setRnboDevice);
  const triggerEventRef = useRef(triggerEvent);
  const setNumEventsRef = useRef(setNumEvents);
  const setNoteWindowOffsetRef = useRef(setNoteWindowOffset);
  const onAngleChangeRef = useRef(onAngleChange);
  const onNumCorners_AChangeRef = useRef(onNumCorners_AChange);
  const onNumCorners_BChangeRef = useRef(onNumCorners_BChange);

  // Update refs when props change (without triggering effect reruns)
  useEffect(() => {
    onAngleChangeRef.current = onAngleChange;
    onNumCorners_AChangeRef.current = onNumCorners_AChange;
    onNumCorners_BChangeRef.current = onNumCorners_BChange;
    setRnboDeviceRef.current = setRnboDevice;
    triggerEventRef.current = triggerEvent;
    setNumEventsRef.current = setNumEvents;
    setNoteWindowOffsetRef.current = setNoteWindowOffset;
  }, [
    onAngleChange,
    onNumCorners_AChange,
    onNumCorners_BChange,
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

        // Initialize numCorners_A value
        if (onNumCorners_AChangeRef.current) {
          const numCorners_AParam = device.parameters.find(
            (p) => p.name === "numCorners_A"
          );
          if (numCorners_AParam) {
            onNumCorners_AChangeRef.current(
              Math.round(numCorners_AParam.value)
            );
          }
        }

        // Initialize numCorners_B value
        if (onNumCorners_BChangeRef.current) {
          const numCorners_BParam = device.parameters.find(
            (p) => p.name === "numCorners_B"
          );
          if (numCorners_BParam) {
            onNumCorners_BChangeRef.current(
              Math.round(numCorners_BParam.value)
            );
          }
        }

        // Initialize numEvents_A from RNBO device if it exists AND we haven't done it yet
        if (!numEventsInitializedRef.current.A) {
          const numEvents_AParam = device.parameters.find(
            (p) => p.name === "numEvents_A"
          );
          if (
            numEvents_AParam &&
            typeof setNumEventsRef.current === "function"
          ) {
            setNumEventsRef.current(Math.round(numEvents_AParam.value), "A");
            numEventsInitializedRef.current.A = true; // Mark as initialized
          }
        }

        // Initialize numEvents_B from RNBO device if it exists AND we haven't done it yet
        if (!numEventsInitializedRef.current.B) {
          const numEvents_BParam = device.parameters.find(
            (p) => p.name === "numEvents_B"
          );
          if (
            numEvents_BParam &&
            typeof setNumEventsRef.current === "function"
          ) {
            setNumEventsRef.current(Math.round(numEvents_BParam.value), "B");
            numEventsInitializedRef.current.B = true; // Mark as initialized
          }
        }

        // Send initial start_index of 0 for both A and B
        if (typeof setNoteWindowOffsetRef.current === "function") {
          setNoteWindowOffsetRef.current(0, "A");
          setNoteWindowOffsetRef.current(0, "B");
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
          } else if (ev.tag === "trigger_A") {
            const eventIndex = ev.payload;

            // Trigger the event through the context for polygon A
            if (typeof triggerEventRef.current === "function") {
              triggerEventRef.current(eventIndex, "A");
            }
          } else if (ev.tag === "trigger_B") {
            const eventIndex = ev.payload;

            // Trigger the event through the context for polygon B
            if (typeof triggerEventRef.current === "function") {
              triggerEventRef.current(eventIndex, "B");
            }
          }
        });
      } catch (err) {
        logger.error("Error in component setup:", err);
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
        if (param.name === "numCorners_A" && onNumCorners_AChangeRef.current) {
          onNumCorners_AChangeRef.current(Math.round(value));
        }

        if (param.name === "numCorners_B" && onNumCorners_BChangeRef.current) {
          onNumCorners_BChangeRef.current(Math.round(value));
        }

        // Handle numEvents_A parameter
        if (
          param.name === "numEvents_A" &&
          typeof setNumEventsRef.current === "function"
        ) {
          // We don't need to sync to RNBO since the slider already did that
          setNumEventsRef.current(Math.round(value), "A");

          // When numEvents changes, we need to ensure the window offset is still valid
          // If the window offset would cause events to go out of bounds, adjust it
          if (typeof setNoteWindowOffsetRef.current === "function") {
            // Check and possibly adjust the window offset for A
            setNoteWindowOffsetRef.current(state.noteWindowOffset.A, "A");
          }
        }

        // Handle numEvents_B parameter
        if (
          param.name === "numEvents_B" &&
          typeof setNumEventsRef.current === "function"
        ) {
          // We don't need to sync to RNBO since the slider already did that
          setNumEventsRef.current(Math.round(value), "B");

          // When numEvents changes, we need to ensure the window offset is still valid
          // If the window offset would cause events to go out of bounds, adjust it
          if (typeof setNoteWindowOffsetRef.current === "function") {
            // Check and possibly adjust the window offset for B
            setNoteWindowOffsetRef.current(state.noteWindowOffset.B, "B");
          }
        }
      }
    } catch (err) {
      logger.error("Error changing parameter:", err);
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
    <div className="w-1/2 p-4 border rounded-md bg-[var(--foreground)] text-white">
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
