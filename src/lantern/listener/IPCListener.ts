import Electron from "electron";
import { Launcher } from "../launcher/Launcher";
/**
 * IPC name convention: lantern:${verb}-${nouns}-${adjective}
 * Examples: lantern:change-network, lantern:remove-listener-half
 */
export interface IPCListener {
  name: string;
  onListen: (event: Electron.IpcMainEvent, ...args: any) => void;
}

export class IPCListenerManager {
  listeners: IPCListener[] = new Array();
}
