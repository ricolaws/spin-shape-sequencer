export class Event {
  index: number;
  active: boolean;
  noteValue: number;
  triggered: boolean;
  triggerOpacity: number;
  hovered: boolean;

  // Position will be calculated by the Ring component
  x: number = 0;
  y: number = 0;
  z: number = 0;

  // For 3D position
  position: [number, number, number] = [0, 0, 0];

  constructor(index: number, noteValue: number = 0, active: boolean = false) {
    this.index = index;
    this.noteValue = noteValue;
    this.active = active;
    this.triggered = false;
    this.triggerOpacity = 0;
    this.hovered = false;
  }

  setActive(value: boolean): void {
    this.active = value;
    console.log(`Event ${this.index}: Active state set to ${value}`);
    // In a real implementation, this would send a message to the RNBO device
    // e.g., sendMessageToRNBO(this.index, value ? 1 : 0);
  }

  trigger(): boolean {
    if (this.active) {
      console.log(`Event ${this.index}: Triggering)`);
      this.triggered = true;
      this.triggerOpacity = 1;
      return true;
    }
    console.log(
      `Event ${this.index}: Trigger attempted but event is not active`
    );
    return false;
  }

  endTrigger(): void {
    console.log(`Event ${this.index}: End trigger called`);
    this.triggered = false;
    this.triggerOpacity = 0;
  }

  toggle(): void {
    console.log(
      `Event ${this.index}: Toggling active state from ${this.active} to ${!this
        .active}`
    );
    this.setActive(!this.active);
  }

  getNoteDisplay(): string {
    if (this.noteValue === 0) return "✖︎";

    const noteNames = [
      "C",
      "C♯",
      "D",
      "D♯",
      "E",
      "F",
      "F♯",
      "G",
      "G♯",
      "A",
      "A♯",
      "B",
    ];
    const noteName = noteNames[this.noteValue % 12];
    const octave = Math.floor(this.noteValue / 12) - 2;
    return `${noteName}${octave}`;
  }

  setPosition(radius: number, angle: number): void {
    // Calculate position based on radius and angle (in radians)
    this.x = radius * Math.cos(angle);
    this.y = radius * Math.sin(angle);
    this.position = [this.x, this.y, 0];
  }
}
