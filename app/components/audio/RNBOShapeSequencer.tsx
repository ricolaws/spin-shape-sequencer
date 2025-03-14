"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  // Add render counter for diagnostics
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // Log component lifecycle
  console.log(
    `[DIAGNOSTIC] RNBOShapeSequencer render #${renderCountRef.current}`
  );

  const { setRnboDevice, triggerEvent, setNumEvents } = useSequencer();
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [deviceStatus, setDeviceStatus] = useState("Initializing...");
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(
    null
  );
  const numEventsInitializedRef = useRef(false);
  const angleRef = useRef(0);

  // Store function references to prevent effect reruns
  const setRnboDeviceRef = useRef(setRnboDevice);
  const triggerEventRef = useRef(triggerEvent);
  const setNumEventsRef = useRef(setNumEvents);
  const onAngleChangeRef = useRef(onAngleChange);
  const onNumCornersChangeRef = useRef(onNumCornersChange);

  // Throttle angle updates to reduce renders - only update angle position every 50ms
  const throttleAngleUpdates = useCallback(() => {
    let lastCallTime = 0;
    const throttleMs = 50; // Throttling delay

    return (angle: number) => {
      const now = Date.now();
      angleRef.current = angle; // Always store the latest angle

      // Only call the onAngleChange prop if enough time has elapsed
      if (now - lastCallTime >= throttleMs) {
        if (onAngleChangeRef.current) {
          onAngleChangeRef.current(angle);
        }
        lastCallTime = now;
      }
    };
  }, []);

  // Create the throttled angle handler once
  const throttledAngleHandler = useMemo(
    () => throttleAngleUpdates(),
    [throttleAngleUpdates]
  );

  // Update refs when props change (without triggering effect reruns)
  useEffect(() => {
    onAngleChangeRef.current = onAngleChange;
    onNumCornersChangeRef.current = onNumCornersChange;
    setRnboDeviceRef.current = setRnboDevice;
    triggerEventRef.current = triggerEvent;
    setNumEventsRef.current = setNumEvents;
  }, [
    onAngleChange,
    onNumCornersChange,
    setRnboDevice,
    triggerEvent,
    setNumEvents,
  ]);

  useEffect(() => {
    console.log("[DIAGNOSTIC] Setup effect running");

    async function setup() {
      try {
        console.log("[DIAGNOSTIC] Getting RNBO device");
        const device = await getOrCreateDevice(setDeviceStatus);
        if (!device) {
          console.error("[DIAGNOSTIC] Failed to create RNBO device");
          setDeviceStatus("Failed to create RNBO device");
          return;
        }
        console.log("[DIAGNOSTIC] Successfully got RNBO device");

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
            console.log(
              `[DIAGNOSTIC] Initializing numCorners to ${Math.round(
                numCornersParam.value
              )}`
            );
            onNumCornersChangeRef.current(Math.round(numCornersParam.value));
          }
        }

        // Initialize numEvents from RNBO device if it exists AND we haven't done it yet
        if (!numEventsInitializedRef.current) {
          const numEventsParam = device.parameters.find(
            (p) => p.name === "numEvents"
          );
          if (numEventsParam && typeof setNumEventsRef.current === "function") {
            console.log(
              `[DIAGNOSTIC] Initializing numEvents to ${Math.round(
                numEventsParam.value
              )}`
            );
            setNumEventsRef.current(Math.round(numEventsParam.value));
            numEventsInitializedRef.current = true; // Mark as initialized
          }
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

        console.log(`[DIAGNOSTIC] Setting ${sortedParams.length} parameters`);
        setParameters(sortedParams);
        setDeviceStatus("Ready - Click anywhere to start audio");

        // Subscribe to messages from RNBO device
        if (messageSubscriptionRef.current) {
          console.log("[DIAGNOSTIC] Unsubscribing from previous messages");
          messageSubscriptionRef.current.unsubscribe();
        }

        console.log("[DIAGNOSTIC] Subscribing to RNBO device messages");
        messageSubscriptionRef.current = device.messageEvent.subscribe((ev) => {
          // Handle angle messages
          if (ev.tag === "angle") {
            // Throttle angle updates to reduce rendering
            throttledAngleHandler(ev.payload);

            // Occasionally log angle updates (1 out of 100) to avoid console flood
            if (Math.random() < 0.01) {
              console.log(`[DIAGNOSTIC] Angle update: ${ev.payload}`);
            }
          } else if (ev.tag === "trigger") {
            const eventIndex = ev.payload;
            // Trigger the event through the context
            if (typeof triggerEventRef.current === "function") {
              console.log(
                `[DIAGNOSTIC] RNBO: Triggering event ${eventIndex} at ${new Date().toISOString()}`
              );
              triggerEventRef.current(eventIndex);
            } else {
              console.warn(
                "[DIAGNOSTIC] triggerEvent function not available in context"
              );
            }
          } else {
            // Log other message types
            console.log(
              `[DIAGNOSTIC] Received message with tag: ${ev.tag}`,
              ev.payload
            );
          }
        });
      } catch (err) {
        console.error("[DIAGNOSTIC] Error in component setup:", err);
        setDeviceStatus(
          `Error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    setup();

    return () => {
      console.log("[DIAGNOSTIC] Component cleanup");
      if (messageSubscriptionRef.current) {
        console.log("[DIAGNOSTIC] Unsubscribing from messages during cleanup");
        messageSubscriptionRef.current.unsubscribe();
        messageSubscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array - setup runs only once

  // Create a memoized version of the parameter change handler
  const handleParameterChange = useCallback(
    async (paramId: string, value: number) => {
      try {
        console.log(`[DIAGNOSTIC] Parameter change: ${paramId} = ${value}`);
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
          console.log(`[DIAGNOSTIC] Setting ${param.name} to ${value}`);
          param.value = value;

          // Special handling for specific parameters
          if (param.name === "numCorners" && onNumCornersChangeRef.current) {
            console.log(
              `[DIAGNOSTIC] Updating numCorners to ${Math.round(value)}`
            );
            onNumCornersChangeRef.current(Math.round(value));
          }

          // Handle numEvents parameter
          if (
            param.name === "numEvents" &&
            typeof setNumEventsRef.current === "function"
          ) {
            // We don't need to sync to RNBO since the slider already did that
            console.log(
              `[DIAGNOSTIC] Updating numEvents to ${Math.round(value)}`
            );
            setNumEventsRef.current(Math.round(value));
          }
        }
      } catch (err) {
        console.error("[DIAGNOSTIC] Error changing parameter:", err);
      }
    },
    []
  );

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
  }, [parameters, handleParameterChange]);

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
