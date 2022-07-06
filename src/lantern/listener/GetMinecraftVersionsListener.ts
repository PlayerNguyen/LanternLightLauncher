import { getVersionManifest } from "../launcher/LauncherVersion";
import { IPCListener } from "./IPCListener";

export class GetMinecraftVersionListener implements IPCListener {
  name = "lantern:get-minecraft-versions";
  onListen = async (event: Electron.IpcMainEvent, ...args: any) => {
    console.log(
      `Requesting a version list from the browser-thread with args ${args}...`
    );

    let manifest = await getVersionManifest();
    let versionList = manifest.versions.map((version) => {
      return { id: version.id, type: version.type };
    });

    console.log(`Collect ${versionList.length} versions from version manifest`);

    // Resent it for the browser-thread
    event.sender.send(this.name, versionList);
  };
}
