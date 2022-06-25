import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("api", {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
});
