import { IpcMainEvent } from "electron";
import { getLauncherConfigProvider } from "../launcher/Launcher";
import { launchMinecraft } from "../launcher/LauncherGameAsset";
import { IPCListener } from "./IPCListener";

export class LaunchMinecraftListener implements IPCListener {
  name = "lantern:launch-minecraft";
  onListen = async (
    event: IpcMainEvent,
    callback: (...args: any[]) => void
  ) => {
    console.log(`Launching Minecraft program from ${event.sender.id}`);
    let launcherCache = getLauncherConfigProvider();
    if (!launcherCache.cache) {
      throw new Error("Launcher cache is not initialized");
    }
    let cache = launcherCache.cache;

    await launchMinecraft(cache.lastSelectedVersion, cache.offline.username);
  };
}
