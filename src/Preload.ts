import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("api", {
  send: (channel: string, ...args: any[]) => {
    return ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
    return ipcRenderer.on(channel, listener);
  }
});
