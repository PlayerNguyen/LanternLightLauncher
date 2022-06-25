import { LauncherRuntimePersist } from "./../launcher/Launcher";
import { IPCListener } from "./IPCListener";

export class NetworkChangeListener implements IPCListener {
  name = "lantern:change-network";

  onListen = (event: Electron.IpcMainEvent, ...args: any) => {
    console.log(`Detecting network change...`);
    let _status = args[0];
    console.log("Set value to " + _status);

    if (!_status) throw new Error(`Unexpected value ${args[0]}`);

    // Set the value in persist memory
    LauncherRuntimePersist.getRuntimePersist().setData({
      ...LauncherRuntimePersist.getRuntimePersist().data,
      network: _status,
    });

    // Log out to see what we got
    console.log(LauncherRuntimePersist.getRuntimePersist());
  };
}
