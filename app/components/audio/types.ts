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
