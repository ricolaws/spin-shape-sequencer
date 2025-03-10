export class Event {
  index: number;
  active: boolean;
  noteValue: number;
  triggered: boolean;
  triggerOpacity: number;
  hovered: boolean;
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
  }

  trigger(): boolean {
    if (this.active) {
      this.triggered = true;
      this.triggerOpacity = 1;
      return true;
    }
    return false;
  }

  endTrigger(): void {
    this.triggered = false;
    this.triggerOpacity = 0;
  }

  toggle(): void {
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
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    this.position = [x, y, 0];
  }
}
