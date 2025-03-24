import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import { TimeNow, MessageEvent } from "@rnbo/js";
import { Event } from "../components/Event";
import { logger } from "../utils/DebugLogger";
import {
  NoteData,
  SequencerState,
  Target,
  TriggerListener,
  createInitialState,
} from "../audio/types";

// Additional interface for visual events (not in types.ts)
interface VisualState {
  visualEvents: Event[];
}

// ** ** ** LOGGER DEBUG MODE ** ** **
logger.setDebugMode(true);

// Create context with updated type definition
const SequencerContext = createContext<{
  state: SequencerState & VisualState;
  toggleEvent: (index: number, active: boolean, target: Target) => void;
  setNote: (index: number, note: NoteData) => void;
  setRnboDevice: React.Dispatch<any>;
  triggerEvent: (index: number, target: Target) => void;
  registerTriggerListener: (listener: TriggerListener) => () => void;
  setNumEvents: (num: number, target: Target) => void;
  setStartIndex: (index: number, target: Target) => void;
  setNumCorners: (sides: number, target: Target) => void;
  getAbsoluteIndex: (relativeIndex: number, target: Target) => number;
  getRelativeIndex: (absoluteIndex: number, target: Target) => number;
}>(null!);

// Hook for using the sequencer context
export const useSequencer = () => useContext(SequencerContext);

export const SequencerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rnboDevice, setRnboDevice] = useState<any>(null);
  const rnboDeviceRef = useRef<any>(null);

  // Use a ref to store trigger listeners to avoid unnecessary re-renders
  const triggerListenersRef = useRef<TriggerListener[]>([]);

  // Initial state with data from factory function
  const [state, setState] = useState<SequencerState & VisualState>(() => {
    const initialState = createInitialState();

    // Create visual Event objects based on initial data - initial active
    // is true if active in either A or B (logical OR)
    const visualEvents = initialState.events.notes.map((note, index) => {
      const isActiveA = initialState.polygons.A.activeEvents[index];
      const isActiveB = initialState.polygons.B.activeEvents[index];
      const isActive = isActiveA || isActiveB;

      const event = new Event(index, note.pitch, isActive);
      return event;
    });

    return {
      ...initialState,
      visualEvents,
    };
  });

  const initialSyncDoneRef = useRef(false);

  // Keep rnboDeviceRef in sync with rnboDevice state
  useEffect(() => {
    if (rnboDevice) {
      rnboDeviceRef.current = rnboDevice;
    }
  }, [rnboDevice]);

  // Sync to RNBO when device first becomes available
  useEffect(() => {
    if (!rnboDevice) return;

    // Sync when we first get a device connection
    if (!initialSyncDoneRef.current) {
      logger.log("Performing initial sync to RNBO device");
      syncToRNBO(state, rnboDevice);
      initialSyncDoneRef.current = true;
    }
  }, [rnboDevice, state]);

  // Function to sync state to RNBO
  const syncToRNBO = (state: SequencerState & VisualState, device: any) => {
    if (!device || typeof device.scheduleEvent !== "function") {
      logger.error(
        "RNBO device is not properly initialized or does not support scheduleEvent"
      );
      return;
    }

    logger.log("Syncing all note data to RNBO device");

    // Send each note data to RNBO - using absolute indices
    state.events.notes.forEach((note, index) => {
      const event = new MessageEvent(TimeNow, "update_note", [
        index, // Absolute index in the sequence
        note.pitch,
        note.velocity,
      ]);
      try {
        device.scheduleEvent(event);
      } catch (error) {
        logger.error(`Error scheduling event for note ${index}:`, error);
      }
    });

    // Sync active states for both polygons
    syncActiveStates(state, device);

    // Send the current startIndex for both A and B
    // For A
    const startIndexEventA = new MessageEvent(TimeNow, "start_index_A", [
      state.polygons.A.startIndex,
    ]);

    try {
      device.scheduleEvent(startIndexEventA);
      logger.log(
        `Sent start_index_A: ${state.polygons.A.startIndex} to RNBO device`
      );
    } catch (error) {
      logger.error(`Error sending start_index_A to RNBO device:`, error);
    }

    // For B
    const startIndexEventB = new MessageEvent(TimeNow, "start_index_B", [
      state.polygons.B.startIndex,
    ]);

    try {
      device.scheduleEvent(startIndexEventB);
      logger.log(
        `Sent start_index_B: ${state.polygons.B.startIndex} to RNBO device`
      );
    } catch (error) {
      logger.error(`Error sending start_index_B to RNBO device:`, error);
    }

    // Sync polygon sides (numCorners)
    syncNumCorners(state, device);
  };

  // Helper to sync active states for both polygons
  const syncActiveStates = (
    state: SequencerState & VisualState,
    device: any
  ) => {
    // For polygon A, sync active states within current window
    for (let i = 0; i < state.polygons.A.numEvents; i++) {
      const absoluteIndex = state.polygons.A.startIndex + i;
      if (absoluteIndex < state.events.notes.length) {
        const activeEvent = new MessageEvent(TimeNow, "update_active_A", [
          i, // Relative index within window
          state.polygons.A.activeEvents[absoluteIndex] ? 1 : 0,
        ]);
        try {
          device.scheduleEvent(activeEvent);
        } catch (error) {
          logger.error(
            `Error syncing active state for A at index ${i}:`,
            error
          );
        }
      }
    }

    // For polygon B, sync active states within current window
    for (let i = 0; i < state.polygons.B.numEvents; i++) {
      const absoluteIndex = state.polygons.B.startIndex + i;
      if (absoluteIndex < state.events.notes.length) {
        const activeEvent = new MessageEvent(TimeNow, "update_active_B", [
          i, // Relative index within window
          state.polygons.B.activeEvents[absoluteIndex] ? 1 : 0,
        ]);
        try {
          device.scheduleEvent(activeEvent);
        } catch (error) {
          logger.error(
            `Error syncing active state for B at index ${i}:`,
            error
          );
        }
      }
    }
  };

  // Helper to sync polygon numCorners
  const syncNumCorners = (state: SequencerState & VisualState, device: any) => {
    // Set numCorners_A parameter
    const numCorners_AParam = device.parameters.find(
      (p: { name: string }) => p.name === "numCorners_A"
    );
    if (numCorners_AParam) {
      numCorners_AParam.value = state.polygons.A.numCorners;
      logger.log(`Set numCorners_A to ${state.polygons.A.numCorners}`);
    }

    // Set numCorners_B parameter
    const numCorners_BParam = device.parameters.find(
      (p: { name: string }) => p.name === "numCorners_B"
    );
    if (numCorners_BParam) {
      numCorners_BParam.value = state.polygons.B.numCorners;
      logger.log(`Set numCorners_B to ${state.polygons.B.numCorners}`);
    }
  };

  // Conversion functions between absolute and relative indices
  const getAbsoluteIndex = useCallback(
    (relativeIndex: number, target: Target): number => {
      return state.polygons[target].startIndex + relativeIndex;
    },
    [state]
  );

  const getRelativeIndex = useCallback(
    (absoluteIndex: number, target: Target): number => {
      return absoluteIndex - state.polygons[target].startIndex;
    },
    [state]
  );

  // Register a trigger listener with target
  const registerTriggerListener = useCallback((listener: TriggerListener) => {
    triggerListenersRef.current.push(listener);

    // Return a function to unregister
    return () => {
      triggerListenersRef.current = triggerListenersRef.current.filter(
        (l) => l !== listener
      );
    };
  }, []);

  // Toggle event active state for specific target
  const toggleEvent = useCallback(
    (index: number, active: boolean, target: Target) => {
      if (index < 0 || index >= state.events.notes.length) return;

      logger.log(
        `SequencerProvider: Setting event ${index} to ${active} for ${target}`
      );

      setState((prev) => {
        // Create new active arrays for the specific target
        const newActiveEvents = [...prev.polygons[target].activeEvents];
        newActiveEvents[index] = active;

        // Update visual event active state based on whether it's active in either A or B
        const isActiveInA =
          target === "A" ? active : prev.polygons.A.activeEvents[index];
        const isActiveInB =
          target === "B" ? active : prev.polygons.B.activeEvents[index];
        const isActiveInEither = isActiveInA || isActiveInB;

        // Create new visualEvents array with updated active state
        const newVisualEvents = [...prev.visualEvents];
        if (newVisualEvents[index]) {
          newVisualEvents[index].setActive(isActiveInEither);
        }

        // Return updated state
        return {
          ...prev,
          polygons: {
            ...prev.polygons,
            [target]: {
              ...prev.polygons[target],
              activeEvents: newActiveEvents,
            },
          },
          visualEvents: newVisualEvents,
        };
      });

      // Send update to RNBO if device is available
      if (rnboDeviceRef.current) {
        // Convert to relative index for the target
        const relativeIndex = getRelativeIndex(index, target);

        // Only send to RNBO if the event is within the current window
        if (
          relativeIndex >= 0 &&
          relativeIndex < state.polygons[target].numEvents
        ) {
          const event = new MessageEvent(TimeNow, `update_active_${target}`, [
            relativeIndex,
            active ? 1 : 0,
          ]);
          rnboDeviceRef.current.scheduleEvent(event);
          logger.log(
            `Sent update_active_${target}: [${relativeIndex}, ${
              active ? 1 : 0
            }] to RNBO`
          );
        } else {
          logger.log(
            `Event ${index} updated but is outside ${target}'s current window, not sending to RNBO`
          );
        }
      }
    },
    [state, getRelativeIndex]
  );

  // Set note data for an event
  const setNote = useCallback(
    (index: number, note: NoteData) => {
      if (index < 0 || index >= state.events.notes.length) return;

      setState((prev) => {
        const newNotes = [...prev.events.notes];
        newNotes[index] = { ...note };

        // Update the visual Event object's note value
        const newVisualEvents = [...prev.visualEvents];
        if (newVisualEvents[index]) {
          newVisualEvents[index].noteValue = note.pitch;
        }

        return {
          ...prev,
          events: {
            ...prev.events,
            notes: newNotes,
          },
          visualEvents: newVisualEvents,
        };
      });

      // Send update to RNBO
      if (rnboDeviceRef.current) {
        const event = new MessageEvent(TimeNow, "update_note", [
          index,
          note.pitch,
          note.velocity,
        ]);
        rnboDeviceRef.current.scheduleEvent(event);
        logger.log(
          `Sent update_note: [${index}, ${note.pitch}, ${note.velocity}] to RNBO`
        );
      }
    },
    [state.events.notes.length]
  );

  // Trigger visual event and notify listeners for specific target
  const triggerEvent = useCallback(
    (index: number, target: Target) => {
      // Convert relative index from RNBO to absolute index
      const absoluteIndex = getAbsoluteIndex(index, target);

      // Validate the index
      if (absoluteIndex < 0 || absoluteIndex >= state.visualEvents.length) {
        logger.warn(
          `Trigger absolute index ${absoluteIndex} out of range (0-${
            state.visualEvents.length - 1
          })`
        );
        return;
      }

      logger.log(
        `SequencerProvider: Triggering event ${absoluteIndex} for ${target}, active: ${state.polygons[target].activeEvents[absoluteIndex]}`
      );

      // Only update if the event is active for this target
      if (state.polygons[target].activeEvents[absoluteIndex]) {
        // Directly trigger the event object
        const triggered = state.visualEvents[absoluteIndex].trigger();

        if (triggered) {
          // Force a state update to reflect the trigger animation
          setState((prev) => ({
            ...prev,
            visualEvents: [...prev.visualEvents], // Create new array to force re-render
          }));

          logger.log(
            `SequencerProvider: Event ${absoluteIndex} triggered successfully for ${target}`
          );
        }

        // Notify listeners for this target with the relative index
        triggerListenersRef.current
          .filter((listener) => listener.target === target)
          .forEach((listener) => {
            try {
              listener.onTrigger(index); // Using original relative index
            } catch (err) {
              logger.error(`Error in trigger listener for ${target}:`, err);
            }
          });
      }
    },
    [state, getAbsoluteIndex]
  );

  // Set number of events for a specific target
  const setNumEvents = useCallback(
    (num: number, target: Target) => {
      const validNum = Math.max(
        1,
        Math.min(state.events.notes.length, Math.round(num))
      );
      logger.log(`Setting numEvents for ${target} to ${validNum}`);

      setState((prev) => ({
        ...prev,
        polygons: {
          ...prev.polygons,
          [target]: {
            ...prev.polygons[target],
            numEvents: validNum,
          },
        },
      }));

      // Update RNBO parameter if device is available
      if (rnboDeviceRef.current) {
        const paramName = `numEvents_${target}`;
        const param = rnboDeviceRef.current.parameters.find(
          (p: { name: string }) => p.name === paramName
        );

        if (param) {
          param.value = validNum;
          logger.log(`Updated RNBO parameter ${paramName} to ${validNum}`);
        } else {
          logger.warn(`Parameter ${paramName} not found in RNBO device`);
        }
      }
    },
    [state.events.notes.length]
  );

  // Set the starting index for a specific target
  const setStartIndex = useCallback(
    (index: number, target: Target) => {
      // Ensure index is within valid range
      const maxStartIndex = Math.max(
        0,
        state.events.notes.length - state.polygons[target].numEvents
      );
      const validIndex = Math.max(0, Math.min(maxStartIndex, index));

      logger.log(`Setting startIndex for ${target} to ${validIndex}`);

      setState((prev) => ({
        ...prev,
        polygons: {
          ...prev.polygons,
          [target]: {
            ...prev.polygons[target],
            startIndex: validIndex,
          },
        },
      }));

      // Send start_index message to RNBO device
      if (rnboDeviceRef.current) {
        const event = new MessageEvent(TimeNow, `start_index_${target}`, [
          validIndex,
        ]);
        try {
          rnboDeviceRef.current.scheduleEvent(event);
          logger.log(
            `Sent start_index_${target}: ${validIndex} to RNBO device`
          );
        } catch (error) {
          logger.error(
            `Error sending start_index_${target} to RNBO device:`,
            error
          );
        }
      }
    },
    [state]
  );

  // Set the number of corners for a polygon
  const setNumCorners = useCallback((sides: number, target: Target) => {
    // Ensure sides is between 3 and 8
    const validSides = Math.max(3, Math.min(8, Math.round(sides)));

    logger.log(`Setting numCorners for ${target} to ${validSides}`);

    setState((prev) => ({
      ...prev,
      polygons: {
        ...prev.polygons,
        [target]: {
          ...prev.polygons[target],
          numCorners: validSides,
        },
      },
    }));

    // Update RNBO parameter if device is available
    if (rnboDeviceRef.current) {
      const paramName = `numCorners_${target}`;
      const param = rnboDeviceRef.current.parameters.find(
        (p: { name: string }) => p.name === paramName
      );

      if (param) {
        param.value = validSides;
        logger.log(`Updated RNBO parameter ${paramName} to ${validSides}`);
      } else {
        logger.warn(`Parameter ${paramName} not found in RNBO device`);
      }
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      toggleEvent,
      setNote,
      setRnboDevice,
      triggerEvent,
      registerTriggerListener,
      setNumEvents,
      setStartIndex,
      setNumCorners,
      getAbsoluteIndex,
      getRelativeIndex,
    }),
    [
      state,
      toggleEvent,
      setNote,
      triggerEvent,
      registerTriggerListener,
      setNumEvents,
      setStartIndex,
      setNumCorners,
      getAbsoluteIndex,
      getRelativeIndex,
    ]
  );

  // Return context with all functions
  return (
    <SequencerContext.Provider value={contextValue}>
      {children}
    </SequencerContext.Provider>
  );
};
