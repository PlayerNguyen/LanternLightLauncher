import { Launcher } from "../launcher/Launcher";
import { IPCListener } from "./IPCListener";
export class GetLauncherConfigurationListener implements IPCListener {
  name: string = "lantern:get-launcher-configuration";
  onListen = async (event: Electron.IpcMainEvent, ...args: any) => {
    console.log(
      `Requesting a launcher configuration from the browser-thread with args ${args}...`
    );
    let launcherConfigProvider = Launcher.getInstance().getConfigProvider();

    if (!launcherConfigProvider.cache) {
      console.warn(`No configuration cache found, loading default...`);
      launcherConfigProvider.loadDefault();
    }

    let config = launcherConfigProvider.getCache();
    event.sender.send(this.name, config);
  };
}
