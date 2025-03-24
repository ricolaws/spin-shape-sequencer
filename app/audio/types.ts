// RNBO Types * * *
export interface Parameter {
  id: string;
  name: string;
  min: number;
  max: number;
  steps: number;
  value: number;
}

export interface RNBODeviceType {
  node: AudioNode;
  parameters: Parameter[];
  messageEvent: {
    subscribe: (callback: (ev: MessageEvent) => void) => {
      unsubscribe: () => void;
    };
  };
  [key: string]: any;
}

export interface MessageEvent {
  tag: string;
  payload: any;
}

// Sequencer Types * * *
// Shared Note Data
export interface NoteData {
  pitch: number;
  velocity: number;
}

// polygon-specific state
export interface PolygonState {
  numCorners: number;
  numEvents: number;
  startIndex: number;
  activeEvents: boolean[];
}

export type Target = "A" | "B";

// Main sequencer state structure
export interface SequencerState {
  // Note sequence data
  events: {
    notes: NoteData[];
  };

  // Polygon-specific state
  polygons: {
    A: PolygonState;
    B: PolygonState;
  };
}

// Interface for trigger listeners
export interface TriggerListener {
  onTrigger: (index: number) => void;
  target: "A" | "B"; // Which polygon this listener is for
}

// Factory for creating initial sequencer state
export function createInitialState(): SequencerState {
  // Initial note and active data (16 notes)
  const initialNotes: NoteData[] = [
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

  // All events active by default
  const initialActive = Array(initialNotes.length).fill(true);

  return {
    events: {
      notes: initialNotes,
    },
    polygons: {
      A: {
        numCorners: 5,
        numEvents: 8, // Default to 8 events for polygon A
        startIndex: 0,
        activeEvents: initialActive,
      },
      B: {
        numCorners: 5,
        numEvents: 5, // Default to 5 events for polygon B
        startIndex: 0,
        activeEvents: initialActive,
      },
    },
  };
}
