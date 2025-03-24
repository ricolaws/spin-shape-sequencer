import React, { useRef, useEffect, useCallback, memo } from "react";
import { useSequencer } from "../../context/SequencerProvider";
import SeqRing, { RingRef } from "./SeqRing";
import { logger } from "../../utils/DebugLogger";
import { colors } from "../../../app/styles/colors";
import { Target } from "../../audio/types";

interface SeqRingWrapperProps {
  target: Target; // Which polygon this ring is for
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
  const { state, toggleEvent, registerTriggerListener, getAbsoluteIndex } =
    useSequencer();

  const ringRef = useRef<RingRef>(null);

  useEffect(() => {
    if (!registerTriggerListener) {
      logger.warn("registerTriggerListener is not available");
      return;
    }

    const listener = {
      onTrigger: (relativeIndex: number) => {
        // The index is relative to the window - directly usable by SeqRing
        if (
          relativeIndex >= 0 &&
          relativeIndex < state.polygons[target].numEvents
        ) {
          if (ringRef.current) {
            ringRef.current.triggerEvent(relativeIndex);
          }
        }
      },
      target, // Specify which polygon this listener is for
    };

    const unregister = registerTriggerListener(listener);
    return unregister;
  }, [registerTriggerListener, state.polygons, target]);

  // Get only the notes and active states for the visible events based on the window position
  const { startIndex, numEvents } = state.polygons[target];

  // Get visible notes for the current window
  const visibleNotes = state.events.notes.slice(
    startIndex,
    startIndex + numEvents
  );

  // Get visible active events for the current target
  const visibleActive = state.polygons[target].activeEvents.slice(
    startIndex,
    startIndex + numEvents
  );

  // Create a handler that adjusts the index based on window position
  const handleEventToggle = useCallback(
    (localIndex: number, newActiveState: boolean) => {
      // Convert local index to absolute index
      const absoluteIndex = getAbsoluteIndex(localIndex, target);

      // Ensure it's a valid index
      if (absoluteIndex < state.events.notes.length) {
        logger.log(
          `SeqRingWrapper (${target}): Toggling event ${absoluteIndex} to ${newActiveState}`
        );

        // Call toggleEvent with absolute index, new state, and target
        toggleEvent(absoluteIndex, newActiveState, target);
      }
    },
    [state.events.notes.length, toggleEvent, target, getAbsoluteIndex]
  );

  return (
    <SeqRing
      ref={ringRef}
      radius={radius}
      posZ={posZ}
      eventCount={numEvents}
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
