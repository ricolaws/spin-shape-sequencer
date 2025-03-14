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
      onTrigger: (relativeIndex: number) => {
        // The index is now relative to the window - directly usable by SeqRing
        if (relativeIndex >= 0 && relativeIndex < state.numEvents) {
          if (ringRef.current) {
            ringRef.current.triggerEvent(relativeIndex);
          }
        }
      },
    };

    const unregister = registerTriggerListener(listener);
    return unregister;
  }, [registerTriggerListener, state.numEvents]);

  // Calculate the starting index based on the offset
  const maxOffset = state.events.notes.length - state.numEvents;
  const startIndex = Math.round(state.noteWindowOffset * maxOffset);

  // Get only the notes and active states for the visible events based on the window position
  const visibleNotes = state.events.notes.slice(
    startIndex,
    startIndex + state.numEvents
  );
  const visibleActive = state.events.active.slice(
    startIndex,
    startIndex + state.numEvents
  );

  // Create a handler that adjusts the index based on window position
  const handleEventToggle = (localIndex: number) => {
    const actualIndex = startIndex + localIndex;
    if (actualIndex < state.events.active.length) {
      toggleEvent(actualIndex);
    }
  };

  return (
    <SeqRing
      ref={ringRef}
      radius={radius}
      eventCount={state.numEvents}
      markerSize={markerSize}
      color={color}
      activeColor={activeColor}
      inactiveColor={inactiveColor}
      triggerColor={triggerColor}
      noteValues={visibleNotes.map((note) => note.pitch)}
      initialActiveEvents={visibleActive}
      onEventToggle={handleEventToggle}
    />
  );
};

export default SeqRingWrapper;
