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
import { logger } from "../components/DebugLogger";

// Define the trigger listener interface
interface TriggerListener {
  onTrigger: (index: number) => void;
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
  numEvents: number; // Number of events to display
  noteWindowOffset: number; // Position of the note window (0 to 1)
}

// LOGGER DEBUG MODE
logger.setDebugMode(false);

// Create context with updated type definition
const SequencerContext = createContext<{
  state: SequencerState;
  toggleEvent: (index: number, newActiveState?: boolean) => void; // Added newActiveState parameter
  setNote: (index: number, note: NoteData) => void;
  setRnboDevice: React.Dispatch<any>;
  triggerEvent: (index: number) => void;
  registerTriggerListener: (listener: TriggerListener) => () => void;
  setNumEvents: (num: number) => void;
  setNoteWindowOffset: (offset: number) => void;
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
      numEvents: initialNotes.length, // Default to showing all events
      noteWindowOffset: 0, // Start at the beginning (0%)
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

    // Send the current start_index
    const maxOffset = state.events.notes.length - state.numEvents;
    const startIndex = Math.round(state.noteWindowOffset * maxOffset);

    const startIndexEvent = new MessageEvent(TimeNow, "start_index", [
      startIndex,
    ]);
    try {
      device.scheduleEvent(startIndexEvent);
      logger.log(`Sent start_index: ${startIndex} to RNBO device`);
    } catch (error) {
      logger.error(`Error sending start_index to RNBO device:`, error);
    }
  };

  // Calculate the current window start index
  const getWindowStartIndex = useCallback(() => {
    const maxOffset = state.events.notes.length - state.numEvents;
    return Math.round(state.noteWindowOffset * maxOffset);
  }, [state.events.notes.length, state.numEvents, state.noteWindowOffset]);

  // Register a trigger listener (using useCallback to maintain stability)
  const registerTriggerListener = useCallback((listener: TriggerListener) => {
    triggerListenersRef.current.push(listener);

    // Return a function to unregister
    return () => {
      triggerListenersRef.current = triggerListenersRef.current.filter(
        (l) => l !== listener
      );
    };
  }, []);

  // MODIFIED: Toggle event active state with option to set specific state
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
          const startIndex = getWindowStartIndex();

          // Calculate the RNBO index based on the window position
          // Only send the update if the toggled event is in the current window
          if (index >= startIndex && index < startIndex + prev.numEvents) {
            const relativeIndex = index - startIndex;

            const event = new MessageEvent(TimeNow, "update_active", [
              relativeIndex, // RNBO expects relative indices within the window
              isActive ? 1 : 0,
            ]);

            rnboDeviceRef.current.scheduleEvent(event);

            logger.log(
              `Sent update_active: [${relativeIndex}, ${
                isActive ? 1 : 0
              }] to RNBO (from absolute index ${index})`
            );
          } else {
            // Event is outside current window - update the full sequence in RNBO
            logger.log(
              `Event ${index} updated but is outside current window, not sending to RNBO`
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

  // Trigger visual event and notify listeners
  const triggerEvent = useCallback(
    (index: number) => {
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
        `SequencerProvider: Triggering event ${index}, active: ${state.events.active[index]}`
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
            `SequencerProvider: Event ${index} triggered successfully`
          );
        }
      }

      // For the ring visualization, we need to convert the absolute index
      // to a relative index within the current window
      const startIndex = getWindowStartIndex();

      // Only trigger ring visualization if the event is in the current window
      if (index >= startIndex && index < startIndex + state.numEvents) {
        const relativeIndex = index - startIndex;

        logger.log(
          `SequencerProvider: Notifying listeners of trigger at relative index ${relativeIndex}`
        );

        // Notify all registered listeners with the relative index
        triggerListenersRef.current.forEach((listener) => {
          try {
            listener.onTrigger(relativeIndex);
          } catch (err) {
            logger.error("Error in trigger listener:", err);
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

  // Set the number of events to display
  const setNumEvents = useCallback(
    (num: number) => {
      const validNum = Math.max(
        1,
        Math.min(state.events.notes.length, Math.round(num))
      );
      logger.log(`Setting numEvents to ${validNum}`);

      setState((prev) => ({
        ...prev,
        numEvents: validNum,
      }));
    },
    [state.events.notes.length]
  );

  // Set the position of the note window
  const setNoteWindowOffset = useCallback(
    (offset: number) => {
      const validOffset = Math.max(0, Math.min(1, offset));
      logger.log(`Setting noteWindowOffset to ${validOffset}`);

      // Calculate the starting index based on the offset
      const maxOffset = state.events.notes.length - state.numEvents;
      const startIndex = Math.round(validOffset * maxOffset);

      logger.log(`Window now starts at index ${startIndex}`);

      setState((prev) => ({
        ...prev,
        noteWindowOffset: validOffset,
      }));

      // Send start_index message to RNBO device
      if (rnboDeviceRef.current) {
        // Create a message event with the starting index
        const event = new MessageEvent(TimeNow, "start_index", [startIndex]);

        try {
          rnboDeviceRef.current.scheduleEvent(event);
          logger.log(`Sent start_index: ${startIndex} to RNBO device`);
        } catch (error) {
          logger.error(`Error sending start_index to RNBO device:`, error);
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
