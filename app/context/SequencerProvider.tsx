import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import { MessageEvent, TimeNow } from "@rnbo/js";
import { Event } from "../components/Event";
import { logger } from "../utils/DebugLogger";

// Define the trigger listener interface with target to specify polygon A or B
interface TriggerListener {
  onTrigger: (index: number) => void;
  target: "A" | "B"; // Which polygon this listener is for
}

// Define types for our sequencer state
interface NoteData {
  pitch: number;
  velocity: number;
}

interface SequencerState {
  events: {
    notes: NoteData[];
    active: boolean[];
  };
  visualEvents: Event[]; // Array of Event objects for visual representation

  // Separate properties for A and B polygons
  numEvents: {
    A: number;
    B: number;
  };

  noteWindowOffset: {
    A: number;
    B: number;
  };
}

// ** ** ** LOGGER DEBUG MODE ** ** **
logger.setDebugMode(true);

// Create context with updated type definition
const SequencerContext = createContext<{
  state: SequencerState;
  toggleEvent: (index: number, newActiveState?: boolean) => void;
  setNote: (index: number, note: NoteData) => void;
  setRnboDevice: React.Dispatch<any>;
  triggerEvent: (index: number, target: "A" | "B") => void;
  registerTriggerListener: (listener: TriggerListener) => () => void;
  setNumEvents: (num: number, target: "A" | "B") => void;
  setNoteWindowOffset: (offset: number, target: "A" | "B") => void;
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

  // Initial state with dummy data
  const [state, setState] = useState<SequencerState>(() => {
    // Initial note and active data
    const initialNotes = [
      { pitch: 55, velocity: 110 },
      { pitch: 62, velocity: 80 },
      { pitch: 60, velocity: 100 },
      { pitch: 65, velocity: 80 },
      { pitch: 67, velocity: 100 },
      { pitch: 70, velocity: 80 },
      { pitch: 63, velocity: 100 },
      { pitch: 72, velocity: 99 },
      { pitch: 60, velocity: 100 },
      { pitch: 62, velocity: 80 },
      { pitch: 63, velocity: 100 },
      { pitch: 65, velocity: 80 },
      { pitch: 67, velocity: 100 },
      { pitch: 58, velocity: 80 },
      { pitch: 60, velocity: 100 },
      { pitch: 72, velocity: 80 },
    ];

    const initialActive = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];

    // Create visual Event objects based on initial data
    const visualEvents = initialNotes.map((note, index) => {
      const event = new Event(index, note.pitch, initialActive[index]);
      return event;
    });

    return {
      events: {
        notes: initialNotes,
        active: initialActive,
      },
      visualEvents: visualEvents,
      // Initialize separate values for A and B
      numEvents: {
        A: 8, // Default to 8 events for A
        B: 5, // Default to 5 events for B
      },
      noteWindowOffset: {
        A: 0, // Start at the beginning (0%) for A
        B: 0, // Start at the beginning (0%) for B
      },
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
  const syncToRNBO = (state: SequencerState, device: any) => {
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

      // Also update active state
      const activeEvent = new MessageEvent(TimeNow, "update_active", [
        index, // Absolute index in the sequence
        state.events.active[index] ? 1 : 0,
      ]);
      try {
        device.scheduleEvent(activeEvent);
      } catch (error) {
        logger.error(
          `Error scheduling active state for event ${index}:`,
          error
        );
      }
    });

    // Send the current start_index for both A and B
    // For A
    const maxOffsetA = state.events.notes.length - state.numEvents.A;
    const startIndexA = Math.round(state.noteWindowOffset.A * maxOffsetA);
    const startIndexEventA = new MessageEvent(TimeNow, "start_index_A", [
      startIndexA,
    ]);

    try {
      device.scheduleEvent(startIndexEventA);
      logger.log(`Sent start_index_A: ${startIndexA} to RNBO device`);
    } catch (error) {
      logger.error(`Error sending start_index_A to RNBO device:`, error);
    }

    // For B
    const maxOffsetB = state.events.notes.length - state.numEvents.B;
    const startIndexB = Math.round(state.noteWindowOffset.B * maxOffsetB);
    const startIndexEventB = new MessageEvent(TimeNow, "start_index_B", [
      startIndexB,
    ]);

    try {
      device.scheduleEvent(startIndexEventB);
      logger.log(`Sent start_index_B: ${startIndexB} to RNBO device`);
    } catch (error) {
      logger.error(`Error sending start_index_B to RNBO device:`, error);
    }
  };

  // Calculate the current window start index for each target
  const getWindowStartIndex = useCallback(
    (target: "A" | "B") => {
      const numEvents = state.numEvents[target];
      const offset = state.noteWindowOffset[target];
      const maxOffset = state.events.notes.length - numEvents;
      return Math.round(offset * maxOffset);
    },
    [state.events.notes.length, state.numEvents, state.noteWindowOffset]
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

  // Toggle event active state with option to set specific state
  const toggleEvent = useCallback(
    (index: number, newActiveState?: boolean) => {
      if (index < 0 || index >= state.events.active.length) return;

      // Log the operation we're about to perform
      logger.log(
        `SequencerProvider: ${
          newActiveState !== undefined ? "Setting" : "Toggling"
        } event ${index} ${
          newActiveState !== undefined
            ? `to ${newActiveState}`
            : "to opposite state"
        }`
      );

      setState((prev) => {
        // Determine the new active state
        const isActive =
          newActiveState !== undefined
            ? newActiveState
            : !prev.events.active[index];

        // Create a new active array with the updated value
        const newActive = [...prev.events.active];
        newActive[index] = isActive;

        // Update the visual Event object
        const newVisualEvents = [...prev.visualEvents];
        if (newVisualEvents[index]) {
          newVisualEvents[index].setActive(isActive);
        }

        const newState = {
          ...prev,
          events: {
            ...prev.events,
            active: newActive,
          },
          visualEvents: newVisualEvents,
        };

        // Send update to RNBO - but only if we have a device
        if (rnboDeviceRef.current) {
          // For both A and B, we need to check if the index is in the current window
          // and update accordingly

          // Check for A
          const startIndexA = getWindowStartIndex("A");
          if (index >= startIndexA && index < startIndexA + prev.numEvents.A) {
            const relativeIndexA = index - startIndexA;
            const eventA = new MessageEvent(TimeNow, "update_active", [
              relativeIndexA, // RNBO expects relative indices within the window
              isActive ? 1 : 0,
            ]);
            rnboDeviceRef.current.scheduleEvent(eventA);
            logger.log(
              `Sent update_active for A: [${relativeIndexA}, ${
                isActive ? 1 : 0
              }] to RNBO (from absolute index ${index})`
            );
          }

          // Check for B
          const startIndexB = getWindowStartIndex("B");
          if (index >= startIndexB && index < startIndexB + prev.numEvents.B) {
            const relativeIndexB = index - startIndexB;
            const eventB = new MessageEvent(TimeNow, "update_active", [
              relativeIndexB, // RNBO expects relative indices within the window
              isActive ? 1 : 0,
            ]);
            rnboDeviceRef.current.scheduleEvent(eventB);
            logger.log(
              `Sent update_active for B: [${relativeIndexB}, ${
                isActive ? 1 : 0
              }] to RNBO (from absolute index ${index})`
            );
          }

          // If the index is outside both windows, just log it
          if (
            (index < startIndexA || index >= startIndexA + prev.numEvents.A) &&
            (index < startIndexB || index >= startIndexB + prev.numEvents.B)
          ) {
            logger.log(
              `Event ${index} updated but is outside both current windows, not sending to RNBO`
            );
          }
        }

        return newState;
      });
    },
    [state.events.active.length, getWindowStartIndex]
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

        const newState = {
          ...prev,
          events: {
            ...prev.events,
            notes: newNotes,
          },
          visualEvents: newVisualEvents,
        };

        // Send update to RNBO
        if (rnboDeviceRef.current) {
          const event = new MessageEvent(TimeNow, "update_note", [
            index,
            note.pitch,
            note.velocity,
          ]);
          rnboDeviceRef.current.scheduleEvent(event);
        }

        return newState;
      });
    },
    [state.events.notes.length]
  );

  // Trigger visual event and notify listeners - now with target
  const triggerEvent = useCallback(
    (index: number, target: "A" | "B") => {
      // The index from RNBO is now an absolute index in the sequence
      // We just need to make sure it's in range for the visual events
      if (index < 0 || index >= state.visualEvents.length) {
        logger.warn(
          `Trigger index ${index} out of range (0-${
            state.visualEvents.length - 1
          })`
        );
        return;
      }

      logger.log(
        `SequencerProvider: Triggering event ${index} for ${target}, active: ${state.events.active[index]}`
      );

      // Only update if the event is active
      if (state.events.active[index]) {
        // Directly trigger the event object
        const triggered = state.visualEvents[index].trigger();

        if (triggered) {
          // Force a state update to reflect the trigger animation
          setState((prev) => {
            // Create a new array with the same objects to force a re-render
            const newVisualEvents = [...prev.visualEvents];

            return {
              ...prev,
              visualEvents: newVisualEvents,
            };
          });

          logger.log(
            `SequencerProvider: Event ${index} triggered successfully for ${target}`
          );
        }
      }

      // For the ring visualization, we need to convert the absolute index
      // to a relative index within the current window for the specific target
      const startIndex = getWindowStartIndex(target);
      const numEvents = state.numEvents[target];

      // Only trigger ring visualization if the event is in the current window
      if (index >= startIndex && index < startIndex + numEvents) {
        const relativeIndex = index - startIndex;

        logger.log(
          `SequencerProvider: Notifying listeners of trigger at relative index ${relativeIndex} for ${target}`
        );

        // Notify only listeners for this target with the relative index
        triggerListenersRef.current
          .filter((listener) => listener.target === target)
          .forEach((listener) => {
            try {
              listener.onTrigger(relativeIndex);
            } catch (err) {
              logger.error(`Error in trigger listener for ${target}:`, err);
            }
          });
      }
    },
    [
      state.visualEvents,
      state.events.active,
      state.numEvents,
      getWindowStartIndex,
    ]
  );

  const setNumEvents = useCallback(
    (num: number, target: "A" | "B") => {
      const validNum = Math.max(
        1,
        Math.min(state.events.notes.length, Math.round(num))
      );
      logger.log(`Setting numEvents for ${target} to ${validNum}`);

      setState((prev) => ({
        ...prev,
        numEvents: {
          ...prev.numEvents,
          [target]: validNum,
        },
      }));

      if (rnboDeviceRef.current) {
        // Find the correct parameter
        const paramName = `numEvents_${target}`;
        const param = rnboDeviceRef.current.parameters.find(
          (p: { name: string }) => p.name === paramName
        );

        if (param) {
          // Update the parameter in RNBO device
          param.value = validNum;
          logger.log(`Updated RNBO parameter ${paramName} to ${validNum}`);
        } else {
          logger.warn(`Parameter ${paramName} not found in RNBO device`);
        }
      }
    },
    [state.events.notes.length]
  );

  // Set the position of the note window for target A or B
  const setNoteWindowOffset = useCallback(
    (offset: number, target: "A" | "B") => {
      const validOffset = Math.max(0, Math.min(1, offset));
      logger.log(`Setting noteWindowOffset for ${target} to ${validOffset}`);

      // Calculate the starting index based on the offset
      const maxOffset = state.events.notes.length - state.numEvents[target];
      const startIndex = Math.round(validOffset * maxOffset);

      console.log(`Window for ${target} now starts at index ${startIndex}`);

      setState((prev) => ({
        ...prev,
        noteWindowOffset: {
          ...prev.noteWindowOffset,
          [target]: validOffset,
        },
      }));

      // Send start_index message to RNBO device
      if (rnboDeviceRef.current) {
        // Create a message event with the starting index
        const event = new MessageEvent(TimeNow, `start_index_${target}`, [
          startIndex,
        ]);

        try {
          rnboDeviceRef.current.scheduleEvent(event);
          logger.log(
            `Sent start_index_${target}: ${startIndex} to RNBO device`
          );
        } catch (error) {
          logger.error(
            `Error sending start_index_${target} to RNBO device:`,
            error
          );
        }
      }
    },
    [state.events.notes.length, state.numEvents]
  );

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
      setNoteWindowOffset,
    }),
    [
      state,
      toggleEvent,
      setNote,
      triggerEvent,
      registerTriggerListener,
      setNumEvents,
      setNoteWindowOffset,
    ]
  );

  // Return context with all functions
  return (
    <SequencerContext.Provider value={contextValue}>
      {children}
    </SequencerContext.Provider>
  );
};
