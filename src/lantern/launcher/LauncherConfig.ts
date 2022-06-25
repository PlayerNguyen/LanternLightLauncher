import { WriteFileOptions } from "fs";
import { DiskFileSystemProvider } from "../platforms/files/common/DiskFileSystem";

export interface LauncherConfigOfflineProfile {
  username: string;
}

export interface LauncherConfig {
  offline: LauncherConfigOfflineProfile;
}

export const LauncherConfigDefaults: LauncherConfig = {
  offline: {
    username: "Player_Nguyen",
  },
};

export class LauncherConfigProvider extends DiskFileSystemProvider {
  cache?: LauncherConfig;

  constructor(name: string, root: string) {
    super(name, root);

    if (!this.exist()) {
      this.loadDefault();
    } else {
      this.readFile();
    }
  }

  public loadDefault(): void {
    this.setCache(LauncherConfigDefaults);
    // Then save it as a file
    this.writeFile(this.cache);
  }

  public writeFile(data: any, options?: WriteFileOptions | undefined): void {
    // Write as JSON
    super.writeFile(JSON.stringify(data, null, 0), options);
  }

  public readFile(options?: any): Buffer {
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
}