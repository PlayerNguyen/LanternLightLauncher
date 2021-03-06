import { LaunchMinecraftListener } from "./../lantern/listener/LaunchMinecraftListener";
import { SetLauncherConfigurationListener } from "./../lantern/listener/SetLauncherConfigurationListener";
import { SetLanguageListener } from "./../lantern/listener/SetLanguageListener";
import { GetLanguageListener } from "./../lantern/listener/GetLanguageListener";
import { ipcMain } from "electron";
import { NetworkChangeListener } from "../lantern/listener/NetworkChangeListener";
import { IPCListenerManager } from "../lantern/listener/IPCListener";
import chalk from "chalk";
import {
  getNodeVersion,
  isDevelopment,
} from "../lantern/platforms/environment/common/Environment";
import { Launcher } from "../lantern/launcher/Launcher";
import { GetMinecraftVersionListener } from "../lantern/listener/GetMinecraftVersionsListener";
import { GetLauncherConfigurationListener } from "../lantern/listener/GetLauncherConfigurationListener";

let listenerManager: IPCListenerManager;
let launcher: Launcher;

/**
 * Bootstraps (initializes) stuff for the launcher before
 * create the browser window.
 */
export async function bootstrap() {
  console.log(
    `NodeJS version: ${chalk.black(chalk.bgGreen(getNodeVersion()))}`
  );

  // Load development preferences here
  if (isDevelopment()) {
    console.log(
      chalk.yellow(
        `Running on development mode ~ loading extension for development`
      )
    );
  }

  await loadListener();
  await loadLauncher();
  await loadConfiguration();
}

async function loadConfiguration() {
  // Whether the config is not found, write a default one
  if (!launcher.getConfigProvider().exist()) {
  }
}

async function loadListener() {
  listenerManager = new IPCListenerManager();
  listenerManager.listeners.push(new NetworkChangeListener());
  listenerManager.listeners.push(new GetLanguageListener());
  listenerManager.listeners.push(new SetLanguageListener());
  listenerManager.listeners.push(new GetMinecraftVersionListener());
  listenerManager.listeners.push(new GetLauncherConfigurationListener());
  listenerManager.listeners.push(new SetLauncherConfigurationListener());
  listenerManager.listeners.push(new LaunchMinecraftListener());
  listenerManager.listeners.forEach((e) => {
    ipcMain.on(e.name, e.onListen);
  });
}

async function loadLauncher() {
  launcher = Launcher.getInstance();
}
