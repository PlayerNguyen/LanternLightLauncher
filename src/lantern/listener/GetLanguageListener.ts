import { Launcher, LauncherRuntimePersist } from "../launcher/Launcher";
import { IPCListener } from "./IPCListener";

export class GetLanguageListener implements IPCListener {
  name = "lantern:get-language";

  onListen = (event: Electron.IpcMainEvent, ...args: any) => {
    console.log(`Getting language for browser-thread ${event.processId} ...`);

    let currentLanguage = Launcher.getInstance()
      .getConfigProvider()
      .getCache()?.language;

    if (currentLanguage) {
      event.sender.send("lantern:get-language", currentLanguage);
    }
  };
}
