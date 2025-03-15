import React, { useRef, useEffect, useCallback, memo } from "react";
import { useSequencer } from "../../context/SequencerProvider";
import SeqRing, { RingRef } from "./SeqRing";
import { logger } from "../DebugLogger";
import { colors } from "../../../app/styles/colors";

interface SeqRingWrapperProps {
  radius?: number;
  markerSize?: number;
}

const SeqRingWrapper: React.FC<SeqRingWrapperProps> = ({
  radius = 2.1,
  markerSize = 0.15,
}) => {
  const { state, toggleEvent, registerTriggerListener } = useSequencer();
  const ringRef = useRef<RingRef>(null);

  useEffect(() => {
    if (!registerTriggerListener) {
      logger.warn("registerTriggerListener is not available");
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
  const handleEventToggle = useCallback(
    (localIndex: number, newActiveState: boolean) => {
      const actualIndex = startIndex + localIndex;
      if (actualIndex < state.events.active.length) {
        // IMPORTANT: We call toggleEvent with the new state directly
        // This ensures SequencerProvider knows exactly what state we want
        logger.log(
          `SeqRingWrapper: Toggling event ${actualIndex} to ${newActiveState}`
        );
        toggleEvent(actualIndex, newActiveState);
      }
    },
    [startIndex, state.events.active.length, toggleEvent]
  );

  return (
    <SeqRing
      ref={ringRef}
      radius={radius}
      eventCount={state.numEvents}
      markerSize={markerSize}
      color={colors.marker.active}
      activeColor={colors.marker.active}
      inactiveColor={colors.marker.inactive}
      triggerColor={colors.primary}
      noteValues={visibleNotes.map((note) => note.pitch)}
      initialActiveEvents={visibleActive}
      onEventToggle={handleEventToggle}
    />
  );
};

export default memo(SeqRingWrapper);
