import { IpcRendererEvent } from "electron";
export {};

interface IElectronAPI {
  send: (channel: string, ...args: any[]) => void;
  on: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: any[]) => void
  ) => IpcRendererEvent;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
