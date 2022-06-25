export {};
interface IElectronAPI {
  send: (channel: string, ...args: any[]) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
