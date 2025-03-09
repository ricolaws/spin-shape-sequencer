import React, { createContext, useContext, useState, useEffect } from "react";
import { MessageEvent, TimeNow } from "@rnbo/js";

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
}

// Create context
const SequencerContext = createContext<{
  state: SequencerState;
  toggleEvent: (index: number) => void;
  setNote: (index: number, note: NoteData) => void;
  setRnboDevice: React.Dispatch<any>;
}>(null!);

// Hook for using the sequencer context
export const useSequencer = () => useContext(SequencerContext);

export const SequencerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rnboDevice, setRnboDevice] = useState<any>(null);
  // Initial state with dummy data
  const [state, setState] = useState<SequencerState>({
    events: {
      notes: [
        { pitch: 60, velocity: 100 }, // C4
        { pitch: 62, velocity: 80 }, // D4
        { pitch: 64, velocity: 100 }, // E4
        { pitch: 65, velocity: 80 }, // F4
        { pitch: 67, velocity: 100 }, // G4
        { pitch: 69, velocity: 80 }, // A4
        { pitch: 71, velocity: 100 }, // B4
        { pitch: 72, velocity: 80 }, // C5
        { pitch: 60, velocity: 100 }, // C4
        { pitch: 62, velocity: 80 }, // D4
        { pitch: 64, velocity: 100 }, // E4
        { pitch: 65, velocity: 80 }, // F4
        { pitch: 67, velocity: 100 }, // G4
        { pitch: 69, velocity: 80 }, // A4
        { pitch: 71, velocity: 100 }, // B4
        { pitch: 72, velocity: 80 }, // C5
      ],
      active: [
        true,
        true,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
      ],
    },
  });

  // Sync to RNBO when component mounts
  useEffect(() => {
    if (!rnboDevice) return;

    // Send initial data to RNBO
    syncToRNBO(state, rnboDevice);
  }, [rnboDevice]); // Only run when RNBO device is available

  // Function to sync state to RNBO
  const syncToRNBO = (state: SequencerState, device: any) => {
    if (!device || typeof device.scheduleEvent !== "function") {
      console.error(
        "RNBO device is not properly initialized or does not support scheduleEvent"
      );
      return;
    }

    // Send each note data to RNBO
    state.events.notes.forEach((note, index) => {
      const event = new MessageEvent(TimeNow, "update_note", [
        index,
        note.pitch,
        note.velocity,
      ]);
      try {
        device.scheduleEvent(event);
      } catch (error) {
        console.error(`Error scheduling event for note ${index}:`, error);
      }
    });
  };

  //   const syncToRNBO = (state: SequencerState, device: any) => {
  //     if (!device) return;

  //     try {
  //       // Instead of using MessageEvent and scheduleEvent, use a method
  //       // that's more likely to be supported by your RNBO implementation

  //       // Option 1: Use setParameterValue if available
  //       state.events.notes.forEach((note, index) => {
  //         if (typeof device.setParameterValue === "function") {
  //           try {
  //             device.setParameterValue(`note_${index}_pitch`, note.pitch);
  //             device.setParameterValue(`note_${index}_velocity`, note.velocity);
  //           } catch (err) {
  //             console.error(`Error setting parameter for note ${index}:`, err);
  //           }
  //         }
  //       });

  //       // Option 2: Try using a sendEvent method if it exists
  //       if (typeof device.sendEvent === "function") {
  //         state.events.notes.forEach((note, index) => {
  //           try {
  //             device.sendEvent("update_note", [index, note.pitch, note.velocity]);
  //           } catch (err) {
  //             console.error(`Error sending event for note ${index}:`, err);
  //           }
  //         });
  //       }

  //       // Option 3: Try using any outport methods from your device
  //       if (
  //         device.outports &&
  //         typeof device.outports.update_note === "function"
  //       ) {
  //         state.events.notes.forEach((note, index) => {
  //           try {
  //             device.outports.update_note(index, note.pitch, note.velocity);
  //           } catch (err) {
  //             console.error(`Error using outport for note ${index}:`, err);
  //           }
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error syncing to RNBO:", error);
  //     }
  //   };

  // Toggle event active state
  const toggleEvent = (index: number) => {
    if (index < 0 || index >= state.events.active.length) return;

    setState((prev) => {
      // Create a new active array with the toggled value
      const newActive = [...prev.events.active];
      newActive[index] = !newActive[index];

      const newState = {
        ...prev,
        events: {
          ...prev.events,
          active: newActive,
        },
      };

      // Send update to RNBO
      if (rnboDevice) {
        const TimeNow = 0;
        const event = new MessageEvent(TimeNow, "update_active", [
          index,
          newActive[index] ? 1 : 0,
        ]);
        rnboDevice.scheduleEvent(event);
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

      const newState = {
        ...prev,
        events: {
          ...prev.events,
          notes: newNotes,
        },
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

  // Return setRnboDevice in the context value
  return (
    <SequencerContext.Provider
      value={{
        state,
        toggleEvent,
        setNote,
        setRnboDevice, // Expose this to let components set the device
      }}
    >
      {children}
    </SequencerContext.Provider>
  );
};
