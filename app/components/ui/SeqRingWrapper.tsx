// In SeqRingWrapper.tsx, simplify the component:

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
  triggerColor = "#ffffff",
}) => {
  const { state, toggleEvent, registerTriggerListener } = useSequencer();
  const ringRef = useRef<RingRef>(null);

  // Register as a trigger listener
  useEffect(() => {
    if (!registerTriggerListener) {
      console.warn("registerTriggerListener is not available");
      return;
    }

    // Create a stable listener object
    const listener = {
      onTrigger: (index: number) => {
        if (ringRef.current) {
          ringRef.current.triggerEvent(index);
        }
      },
    };

    // Register and get unregister function
    const unregister = registerTriggerListener(listener);

    // Clean up on unmount
    return unregister;
  }, [registerTriggerListener]);

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
