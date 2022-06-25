import { PathLike } from "fs";

import fs from "fs";
import path from "path";

/**
 * File system class represents a file system
 */
export interface FileProvider {
  /**
   * A name of the file
   */
  name: string;
  /**
   * A parent root of the file
   */
  root: string;
}

/**
 * Represents a disk file system.
 */
export class DiskFileSystemProvider implements FileProvider {
  name: string;
  root: string;

  constructor(name: string, root: string) {
    this.name = name;
    this.root = root;
  }

  public getPath(): PathLike {
    return path.join(this.root, this.name);
  }

  public exist(): boolean {
    return fs.existsSync(this.getPath());
  }

  public writeFile(data: any, options?: fs.WriteFileOptions): void {
    if (!fs.existsSync(this.root)) {
      fs.mkdirSync(this.root, { recursive: true });
    }

    fs.writeFileSync(this.getPath(), data, options);
  }

  public readFile(options?: any): Buffer {
    return fs.readFileSync(this.getPath(), options);
  }
}
