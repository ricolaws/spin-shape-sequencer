import { MessageEvent, TimeNow } from "@rnbo/js";
import { RNBODeviceType } from "./types";
import { logger } from "../utils/DebugLogger";

export class RNBOCommunicationService {
  private device: RNBODeviceType | null = null;
  private parameterChangeListeners: Map<string, Set<(value: number) => void>> =
    new Map();
  private messageListeners: Map<string, Set<(payload: any) => void>> =
    new Map();

  setDevice(device: RNBODeviceType) {
    this.device = device;

    this.subscribeToDeviceMessages();

    logger.log("RNBOCommunicationService: Device initialized");
    return this;
  }

  getDevice(): RNBODeviceType | null {
    return this.device;
  }

  setParameter(name: string, value: number): boolean {
    if (!this.device) {
      logger.warn(`Cannot set parameter ${name}: Device not initialized`);
      return false;
    }

    const param = this.device.parameters.find((p) => p.name === name);
    if (param) {
      param.value = value;
      logger.log(`Set parameter ${name} to ${value}`);
      return true;
    }

    logger.warn(`Parameter ${name} not found in RNBO device`);
    return false;
  }

  getParameter(name: string): number | null {
    if (!this.device) {
      logger.warn(`Cannot get parameter ${name}: Device not initialized`);
      return null;
    }

    const param = this.device.parameters.find((p) => p.name === name);
    return param ? param.value : null;
  }

  getAllParameters(): any[] {
    if (!this.device) {
      return [];
    }
    return this.device.parameters;
  }

  sendMessage(tag: string, payload: any[]): boolean {
    if (!this.device) {
      logger.warn(`Cannot send message ${tag}: Device not initialized`);
      return false;
    }

    try {
      const event = new MessageEvent(TimeNow, tag, payload);
      this.device.scheduleEvent(event);
      logger.log(`Sent message ${tag} with payload [${payload.join(", ")}]`);
      return true;
    } catch (error) {
      logger.error(`Error sending message ${tag}:`, error);
      return false;
    }
  }

  onParameterChange(
    paramName: string,
    callback: (value: number) => void
  ): () => void {
    if (!this.parameterChangeListeners.has(paramName)) {
      this.parameterChangeListeners.set(paramName, new Set());
    }

    const listeners = this.parameterChangeListeners.get(paramName)!;
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.parameterChangeListeners.get(paramName);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  onMessage(tag: string, callback: (payload: any) => void): () => void {
    if (!this.messageListeners.has(tag)) {
      this.messageListeners.set(tag, new Set());
    }

    const listeners = this.messageListeners.get(tag)!;
    listeners.add(callback);

    return () => {
      const listeners = this.messageListeners.get(tag);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private subscribeToDeviceMessages() {
    if (!this.device) return;

    // Subscribe to messages from the device
    const subscription = this.device.messageEvent.subscribe((event: any) => {
      const { tag, payload } = event;

      // Notify all listeners for this message tag
      const listeners = this.messageListeners.get(tag);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(payload);
          } catch (error) {
            logger.error(`Error in message listener for ${tag}:`, error);
          }
        });
      }
    });

    // Store the subscription for cleanup
    return subscription;
  }

  updateNote(index: number, pitch: number, velocity: number): boolean {
    return this.sendMessage("update_note", [index, pitch, velocity]);
  }

  updateEventActive(index: number, active: boolean): boolean {
    return this.sendMessage("update_active", [index, active ? 1 : 0]);
  }

  setStartIndex(index: number, target: "A" | "B"): boolean {
    return this.sendMessage(`start_index_${target}`, [index]);
  }

  cleanup() {
    this.parameterChangeListeners.clear();
    this.messageListeners.clear();
    this.device = null;
  }
}

export const rnboCommunication = new RNBOCommunicationService();
