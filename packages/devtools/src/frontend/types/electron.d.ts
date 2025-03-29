export {};

declare global {
  interface Window {
    electron: {
      send: (channel: string, ...args: any[]) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}
