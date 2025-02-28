import React, { createContext, useContext, useState, useEffect } from "react";
import { MessageEvent } from "@rnbo/js";

// Define types for our sequencer state
interface NoteData {
  pitch: number;
  velocity: number;
}

interface SequencerState {
  events: {
    notes: NoteData[];
    active: boolean[];
    currentStep: number;
  };
}

// Create context
const SequencerContext = createContext<{
  state: SequencerState;
  toggleEvent: (index: number) => void;
  setNote: (index: number, note: NoteData) => void;
}>(null!);

// Hook for using the sequencer context
export const useSequencer = () => useContext(SequencerContext);

interface SequencerProviderProps {
  children: React.ReactNode;
  rnboDevice: any; // Type for your RNBO device
}

export const SequencerProvider: React.FC<SequencerProviderProps> = ({
  children,
  rnboDevice,
}) => {
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
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
      ],
      currentStep: 0,
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
    if (!device) return;

    // Send each note data to RNBO
    state.events.notes.forEach((note, index) => {
      // Schedule an event to update note data
      const TimeNow = 0; // Send immediately
      const event = new MessageEvent(TimeNow, "update_note", [
        index,
        note.pitch,
        note.velocity,
      ]);
      device.scheduleEvent(event);
    });

    // Send each active state to RNBO
    state.events.active.forEach((isActive, index) => {
      const TimeNow = 0;
      const event = new MessageEvent(TimeNow, "update_active", [
        index,
        isActive ? 1 : 0,
      ]);
      device.scheduleEvent(event);
    });
  };

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

  return (
    <SequencerContext.Provider value={{ state, toggleEvent, setNote }}>
      {children}
    </SequencerContext.Provider>
  );
};
