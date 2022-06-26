import { Persist } from "./../platforms/persist/common/Persist";
import { LauncherConfigProvider } from "./LauncherConfig";
import { isTesting } from "../platforms/environment/common/Environment";
import path from "path";

export function getLauncherMetadata() {
  return {
    FullName: "Lantern Light",
    ShortName: "Lantern",
    /**
     * @deprecated using Path and Filename instead
     */
    ConfigFileName: "lantern_config.json",
    Path: {
      Version: {
        Metadata: path.join(`versions`, `metadata`),
        Asset: path.join(`versions`, `indexes`),
      },
    },
    Filename: {
      Config: "lantern_config.json",
      VersionManifest: "lantern_manifest_version.json",
    },
    API: {
      Url: {
        MinecraftVersionManifestUrl:
          "https://launchermeta.mojang.com/mc/game/version_manifest.json",
        AdoptiumAPIUrlV3: "https://api.adoptopenjdk.net/v3/",
      },
    },
  };
}

/**
 * Determines the app data directory path of the device.
 * For example, in Windows: C:\Users\user\AppData\Roaming.
 * In MacOS: ~/Library/Application Support. In Linux is home/user
 * /.local/share
 *
 * @returns {string} app data path of the device
 */
export function getAppData(): string {
  let _currentOS = process.platform;
  switch (_currentOS) {
    case "darwin": {
      return path.join(
        process.env.HOME as string,
        `Library`,
        `Application Support`
      );
    }
    case "win32": {
      return process.env.APPDATA ? process.env.APPDATA : "window32:\\test";
    }
    case "linux": {
      return path.join(process.env.HOME as string, ".local", "share");
    }
    default: {
      throw new Error("Unsupported platform");
    }
  }
}

export function getLauncherAppData() {
  return path.join(
    getAppData(),
    getLauncherMetadata().ShortName + (isTesting() ? "_Testing" : "")
  );
}

export class Launcher {
  private static launcherInstance?: Launcher;
  private config: LauncherConfigProvider;

  constructor() {
    // Init configuration class
    this.config = new LauncherConfigProvider(
      getLauncherMetadata().Filename.Config,
      getLauncherAppData()
    );
  }

  public static getInstance() {
    if (!this.launcherInstance) {
      this.launcherInstance = new Launcher();
    }

    return this.launcherInstance;
  }

  public getConfigProvider(): LauncherConfigProvider {
    return this.config;
  }
}

export const LauncherRuntimeConfigurationDefault: LauncherRuntimeConfiguration =
  {
    network: "offline",
  };

export interface LauncherRuntimeConfiguration {
  network: "online" | "offline";
}

export class LauncherRuntimePersist {
  private static persist: Persist<LauncherRuntimeConfiguration>;

  public static getRuntimePersist() {
    if (!this.persist) {
      this.persist = new Persist(LauncherRuntimeConfigurationDefault);
    }

    return this.persist;
  }
}

/**
 * Check whether the current system is online, false otherwise.
 * @returns {boolean} true if the network is connected, false otherwise
 */
export function isNetworkOnline(): boolean {
  return LauncherRuntimePersist.getRuntimePersist().data.network === "online";
}
