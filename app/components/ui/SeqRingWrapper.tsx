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
  activeColor = "#ffffff",
  inactiveColor = "#555555",
  triggerColor = "#ffaa00",
}) => {
  const { state, toggleEvent, registerTriggerListener } = useSequencer();
  const ringRef = useRef<RingRef>(null);

  // Register as a trigger listener
  useEffect(() => {
    if (!registerTriggerListener) {
      console.warn("registerTriggerListener is not available");
      return;
    }

    const listener = {
      onTrigger: (index: number) => {
        // Only process triggers for events that are within our displayed range
        if (index >= 0 && index < state.numEvents) {
          if (ringRef.current) {
            ringRef.current.triggerEvent(index);
          }
        }
      },
    };

    const unregister = registerTriggerListener(listener);
    return unregister;
  }, [registerTriggerListener, state.numEvents]);

  // Get only the notes and active states for the visible events
  const visibleNotes = state.events.notes.slice(0, state.numEvents);
  const visibleActive = state.events.active.slice(0, state.numEvents);

  return (
    <SeqRing
      ref={ringRef}
      radius={radius}
      eventCount={state.numEvents} // Use numEvents instead of notes.length
      markerSize={markerSize}
      color={color}
      activeColor={activeColor}
      inactiveColor={inactiveColor}
      triggerColor={triggerColor}
      noteValues={visibleNotes.map((note) => note.pitch)}
      initialActiveEvents={visibleActive}
      onEventToggle={toggleEvent}
    />
  );
};

export default SeqRingWrapper;
