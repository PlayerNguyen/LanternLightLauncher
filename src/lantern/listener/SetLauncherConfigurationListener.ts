import { IpcMainEvent } from "electron";
import { getLauncherConfigProvider, Launcher } from "../launcher/Launcher";
import { IPCListener } from "./IPCListener";

export class SetLauncherConfigurationListener implements IPCListener {
  name = "lantern:set-launcher-configuration";
  onListen = (event: IpcMainEvent, ...args: any[]) => {
    console.log(`Changing launcher configuration to:`, args);

    getLauncherConfigProvider().setCache(args[0]);
    getLauncherConfigProvider().save();
  };
}
