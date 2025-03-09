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
  const { state, toggleEvent } = useSequencer();
  const ringRef = useRef<RingRef>(null);

  // Set up listeners for RNBO trigger messages
  useEffect(() => {
    const handleStepTrigger = (step: number) => {
      console.log(`RNBO triggered step ${step}`);
      if (ringRef.current) {
        ringRef.current.triggerEvent(step);
      }
    };

    // You would set up your actual RNBO message listener here
    // This is just a placeholder
    const cleanup = () => {
      // Clean up any listeners
    };

    return cleanup;
  }, []);

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
