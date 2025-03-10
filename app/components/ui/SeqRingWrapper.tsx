import React, { useRef, useEffect } from "react";
import { useSequencer } from "../../context/SequencerProvider";
import SeqRing, { RingRef } from "./SeqRing";

interface SeqRingWrapperProps {
  radius?: number;
  markerSize?: number;
  color?: string;
  activeColor?: string;
  inactiveColor?: string;
  triggerColor?: string;
}

const SeqRingWrapper: React.FC<SeqRingWrapperProps> = ({
  radius = 2.1,
  markerSize = 0.15,
  color = "#ffffff",
  activeColor = "#ff4500",
  inactiveColor = "#555555",
  triggerColor = "#ffaa00",
}) => {
  const { state, toggleEvent, registerTriggerListener } = useSequencer();
  const ringRef = useRef<RingRef>(null);

  // Store ringRef in a global variable for access by RNBO
  //   useEffect(() => {
  //     // @ts-ignore - Adding ringRef to window for global access
  //     window.globalRingRef = ringRef;

  //     return () => {
  //       // @ts-ignore - Clean up on unmount
  //       delete window.globalRingRef;
  //     };
  //   }, []);

  // Register as a trigger listener
  useEffect(() => {
    // Only if registerTriggerListener exists
    if (!registerTriggerListener) {
      console.warn("registerTriggerListener is not available");
      return;
    }

    // Only log once when first registering
    console.log("SeqRingWrapper: Registering as trigger listener");

    // Create a stable listener object that doesn't change on re-renders
    const listener = {
      onTrigger: (index: number) => {
        console.log(`SeqRingWrapper received trigger for event ${index}`);
        if (ringRef.current) {
          ringRef.current.triggerEvent(index);
        }
      },
    };

    const unregister = registerTriggerListener(listener);

    // Clean up on unmount
    return unregister;
  }, [registerTriggerListener]);

  // Only render the SeqRing component inside the Canvas
  return (
    <SeqRing
      ref={ringRef}
      radius={radius}
      eventCount={state.events.notes.length}
      markerSize={markerSize}
      color={color}
      activeColor={activeColor}
      inactiveColor={inactiveColor}
      triggerColor={triggerColor}
      noteValues={state.events.notes.map((note) => note.pitch)}
      initialActiveEvents={state.events.active}
      onEventToggle={toggleEvent}
    />
  );
};

export default SeqRingWrapper;
