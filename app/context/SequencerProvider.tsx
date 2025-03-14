import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { MessageEvent, TimeNow } from "@rnbo/js";
import { Event } from "../components/Event";

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

// Create context with updated type definition
const SequencerContext = createContext<{
  state: SequencerState;
  toggleEvent: (index: number) => void;
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
  const [triggerListeners, setTriggerListeners] = useState<TriggerListener[]>(
    []
  );

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

  // Sync to RNBO when component mounts
  useEffect(() => {
    if (!rnboDevice) return;

    // Send initial data to RNBO
    syncToRNBO(state, rnboDevice);
  }, [rnboDevice, state]); // Only run when RNBO device is available

  // Function to sync state to RNBO
  const syncToRNBO = (state: SequencerState, device: any) => {
    if (!device || typeof device.scheduleEvent !== "function") {
      console.error(
        "RNBO device is not properly initialized or does not support scheduleEvent"
      );
      return;
    }

    console.log("Syncing all note data to RNBO device");

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
        console.error(`Error scheduling event for note ${index}:`, error);
      }

      // Also update active state
      const activeEvent = new MessageEvent(TimeNow, "update_active", [
        index, // Absolute index in the sequence
        state.events.active[index] ? 1 : 0,
      ]);
      try {
        device.scheduleEvent(activeEvent);
      } catch (error) {
        console.error(
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
      console.log(`Sent start_index: ${startIndex} to RNBO device`);
    } catch (error) {
      console.error(`Error sending start_index to RNBO device:`, error);
    }
  };

  // Register a trigger listener (using useCallback to maintain stability)
  const registerTriggerListener = useCallback((listener: TriggerListener) => {
    setTriggerListeners((prev) => [...prev, listener]);

    // Return a function to unregister
    return () => {
      setTriggerListeners((prev) => prev.filter((l) => l !== listener));
    };
  }, []);

  // Toggle event active state
  const toggleEvent = (index: number) => {
    if (index < 0 || index >= state.events.active.length) return;

    setState((prev) => {
      // Create a new active array with the toggled value
      const newActive = [...prev.events.active];
      newActive[index] = !newActive[index];

      // Update the visual Event object
      const newVisualEvents = [...prev.visualEvents];
      if (newVisualEvents[index]) {
        newVisualEvents[index].setActive(!prev.events.active[index]);
      }

      const newState = {
        ...prev,
        events: {
          ...prev.events,
          active: newActive,
        },
        visualEvents: newVisualEvents,
      };

      // Send update to RNBO
      if (rnboDevice) {
        // Calculate the RNBO index based on the window position
        const maxOffset = state.events.notes.length - state.numEvents;
        const startIndex = Math.round(state.noteWindowOffset * maxOffset);

        // Only send the update if the toggled event is in the current window
        if (index >= startIndex && index < startIndex + state.numEvents) {
          const relativeIndex = index - startIndex;

          const TimeNow = 0;
          const event = new MessageEvent(TimeNow, "update_active", [
            relativeIndex, // RNBO expects relative indices
            newActive[index] ? 1 : 0,
          ]);
          rnboDevice.scheduleEvent(event);

          console.log(
            `Sent update_active: [${relativeIndex}, ${
              newActive[index] ? 1 : 0
            }] to RNBO (from absolute index ${index})`
          );
        } else {
          // Event is outside current window - update the full sequence in RNBO
          // This can be implemented if needed
          console.log(
            `Event ${index} toggled but is outside current window, not sending to RNBO`
          );
        }
      }

      return newState;
    });
  };

  // Set note data for an event
  const setNote = (index: number, note: NoteData) => {
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
      if (rnboDevice) {
        const TimeNow = 0;
        const event = new MessageEvent(TimeNow, "update_note", [
          index,
          note.pitch,
          note.velocity,
        ]);
        rnboDevice.scheduleEvent(event);
      }

      return newState;
    });
  };

  // Trigger visual event and notify listeners (using useCallback)
  const triggerEvent = useCallback(
    (index: number) => {
      // The index from RNBO is now an absolute index in the sequence
      // We just need to make sure it's in range for the visual events
      if (index < 0 || index >= state.visualEvents.length) {
        console.warn(
          `Trigger index ${index} out of range (0-${
            state.visualEvents.length - 1
          })`
        );
        return;
      }

      // Update our internal state (visual feedback)
      setState((prev) => {
        // Only update if the event is active
        if (prev.events.active[index]) {
          const newVisualEvents = [...prev.visualEvents];
          if (newVisualEvents[index]) {
            // Call the trigger method on the Event object
            newVisualEvents[index].trigger();
            console.log(`Event ${index} triggered in SequencerProvider`);
          }

          return {
            ...prev,
            visualEvents: newVisualEvents,
          };
        }
        return prev;
      });

      // For the ring visualization, we need to convert the absolute index
      // to a relative index within the current window
      const maxOffset = state.events.notes.length - state.numEvents;
      const startIndex = Math.round(state.noteWindowOffset * maxOffset);

      // Only trigger ring visualization if the event is in the current window
      if (index >= startIndex && index < startIndex + state.numEvents) {
        const relativeIndex = index - startIndex;

        // Notify all registered listeners with the relative index
        triggerListeners.forEach((listener) => {
          try {
            listener.onTrigger(relativeIndex);
          } catch (err) {
            console.error("Error in trigger listener:", err);
          }
        });
      }
    },
    [
      state.visualEvents,
      triggerListeners,
      state.noteWindowOffset,
      state.numEvents,
      state.events.notes.length,
    ]
  );

  // Set the number of events to display
  const setNumEvents = useCallback(
    (num: number) => {
      const validNum = Math.max(
        1,
        Math.min(state.events.notes.length, Math.round(num))
      );
      console.log(`Setting numEvents to ${validNum}`);

      setState((prev) => ({
        ...prev,
        numEvents: validNum,
      }));
    },
    [state.events.notes.length]
  );

  const setNoteWindowOffset = useCallback(
    (offset: number) => {
      const validOffset = Math.max(0, Math.min(1, offset));
      console.log(`Setting noteWindowOffset to ${validOffset}`);

      // Calculate the starting index based on the offset
      const maxOffset = state.events.notes.length - state.numEvents;
      const startIndex = Math.round(validOffset * maxOffset);

      console.log(`Window now starts at index ${startIndex}`);

      setState((prev) => ({
        ...prev,
        noteWindowOffset: validOffset,
      }));

      // Send start_index message to RNBO device
      if (rnboDevice) {
        // Create a message event with the starting index
        const event = new MessageEvent(TimeNow, "start_index", [startIndex]);

        try {
          rnboDevice.scheduleEvent(event);
          console.log(`Sent start_index: ${startIndex} to RNBO device`);
        } catch (error) {
          console.error(`Error sending start_index to RNBO device:`, error);
        }
      }
    },
    [state.events.notes.length, state.numEvents, rnboDevice]
  );

  // Return context with all functions
  return (
    <SequencerContext.Provider
      value={{
        state,
        toggleEvent,
        setNote,
        setRnboDevice,
        triggerEvent,
        registerTriggerListener,
        setNumEvents,
        setNoteWindowOffset,
      }}
    >
      {children}
    </SequencerContext.Provider>
  );
};
