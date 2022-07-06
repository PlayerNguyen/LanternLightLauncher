import { Launcher } from "./../launcher/Launcher";
import { IPCListener } from "./IPCListener";

export class SetLanguageListener implements IPCListener {
  name = "lantern:set-language";

  onListen = (event: Electron.IpcMainEvent, ...args: any) => {
    console.log(`Changing default language into ${args[0]}`);

    // Launcher.getInstance().getConfigProvider().setCache();
    Launcher.getInstance().getConfigProvider().save();
  };
}
