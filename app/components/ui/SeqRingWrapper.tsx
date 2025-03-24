import React, { useRef, useEffect, useCallback, memo } from "react";
import { useSequencer } from "../../context/SequencerProvider";
import SeqRing, { RingRef } from "./SeqRing";
import { logger } from "../../utils/DebugLogger";
import { colors } from "../../../app/styles/colors";

interface SeqRingWrapperProps {
  target: "A" | "B"; // Which polygon this ring is for
  radius?: number;
  markerSize?: number;
  posZ?: number;
}

const SeqRingWrapper: React.FC<SeqRingWrapperProps> = ({
  target,
  radius = 2.3,
  markerSize = 0.15,
  posZ = 0,
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
        if (relativeIndex >= 0 && relativeIndex < state.numEvents[target]) {
          if (ringRef.current) {
            ringRef.current.triggerEvent(relativeIndex);
          }
        }
      },
      target, // Specify which polygon this listener is for
    };

    const unregister = registerTriggerListener(listener);
    return unregister;
  }, [registerTriggerListener, state.numEvents, target]);

  // Calculate the starting index based on the offset for the specific target
  const maxOffset = state.events.notes.length - state.numEvents[target];
  const startIndex = Math.round(state.noteWindowOffset[target] * maxOffset);

  // Get only the notes and active states for the visible events based on the window position
  const visibleNotes = state.events.notes.slice(
    startIndex,
    startIndex + state.numEvents[target]
  );
  const visibleActive = state.events.active.slice(
    startIndex,
    startIndex + state.numEvents[target]
  );

  // Create a handler that adjusts the index based on window position
  const handleEventToggle = useCallback(
    (localIndex: number, newActiveState: boolean) => {
      const actualIndex = startIndex + localIndex;
      if (actualIndex < state.events.active.length) {
        // IMPORTANT: We call toggleEvent with the new state directly
        // This ensures SequencerProvider knows exactly what state we want
        logger.log(
          `SeqRingWrapper (${target}): Toggling event ${actualIndex} to ${newActiveState}`
        );
        toggleEvent(actualIndex, newActiveState);
      }
    },
    [startIndex, state.events.active.length, toggleEvent, target]
  );

  return (
    <SeqRing
      ref={ringRef}
      radius={radius}
      posZ={posZ}
      eventCount={state.numEvents[target]}
      markerSize={markerSize}
      ringColor={colors.ring}
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
