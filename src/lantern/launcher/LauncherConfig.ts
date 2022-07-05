import { WriteFileOptions } from "fs";
import { DiskFileSystemProvider } from "../platforms/files/common/DiskFileSystem";

export interface LauncherConfigOfflineProfile {
  username: string;
}

export interface LauncherConfig {
  offline: LauncherConfigOfflineProfile;
  language: string;
}

export const LauncherConfigDefaults: LauncherConfig = {
  offline: {
    username: "Player_Nguyen",
  },
  language: "en",
};

export class LauncherConfigProvider extends DiskFileSystemProvider {
  cache?: LauncherConfig;

  constructor(name: string, root: string) {
    super(name, root);

    this.loadDefault();
    this.readFileAndParseToCache();
  }

  public loadDefault(): void {
    // If the file is not exist
    if (!this.exist()) {
      this.setCache(LauncherConfigDefaults);
      // Then save it as a file
      this.writeFile(LauncherConfigDefaults);

      return;
    }

    // If the file is exist, check key
    let launcherCurrentConfig = JSON.parse(this.readFile().toString("utf-8"));
    console.log(launcherCurrentConfig);

    for (let defaultItem in LauncherConfigDefaults) {
      if (!Object.hasOwn(launcherCurrentConfig, defaultItem)) {
        launcherCurrentConfig[defaultItem] =
          // @ts-ignore
          LauncherConfigDefaults[defaultItem];
      }
    }

    this.setCache(launcherCurrentConfig);
    this.save();
  }

  public writeFile(data: any, options?: WriteFileOptions | undefined): void {
    // Write as JSON
    super.writeFile(JSON.stringify(data, null, 0), options);
  }

  public readFileAndParseToCache(options?: any): Buffer {
    let _buffer = super.readFile(options);
    this.cache = JSON.parse(_buffer.toString());
    return _buffer;
  }

  /**
   * Save a cache file
   */
  public save(): void {
    if (!this.exist()) {
      throw new Error(`The configuration file is not exists`);
    }

    this.writeFile(this.cache, { encoding: "utf-8" });
  }

  public setCache(cache: LauncherConfig): void {
    this.cache = cache;
  }

  public getCache() {
    return this.cache;
  }
}
