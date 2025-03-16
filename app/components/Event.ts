import { logger } from "./utils/DebugLogger";
import { getNoteDisplay } from "./utils/sequencerUtils";

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
      logger.log(
        `[Event ${this.index} triggered, opacity set to ${this.triggerOpacity}`
      );
      return true;
    }
    return false;
  }

  endTrigger(): void {
    logger.log(`Event ${this.index} trigger ended.`);

    this.triggered = false;
    this.triggerOpacity = 0;
  }

  toggle(): void {
    this.setActive(!this.active);
  }

  getNoteDisplay(): string {
    return getNoteDisplay(this.noteValue);
  }

  setPosition(radius: number, angle: number): void {
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    this.position = [x, y, 0];
  }
}
