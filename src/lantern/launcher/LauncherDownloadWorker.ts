import chalk from "chalk";
import path from "path";
import { AxiosResponse } from "axios";
import fs from "fs";
import { AxiosStreamLoader } from "./../utils/request/AxiosHelper";
import stream from "node:stream";
import { Queue } from "./../platforms/utils/queue/common/Queue";
import { createSha1 } from "../platforms/crypto/common/Crypto";

export interface ReferenceChecksum {
  hash: string;

  /**
   * Create a hex hash value the hash variable
   * @returns {string} a hash after stream as hex
   */
  createHash(data: string): string;
  checksum(data: string): boolean;
}

export abstract class ReferenceChecksumAbstract {
  hash: string;
  constructor(hash: string) {
    this.hash = hash;
  }
}

export class ReferenceChecksumSHA1 extends ReferenceChecksumAbstract {
  public createHash(data: string): string {
    return createSha1(data);
  }

  checksum(data: string): boolean {
    return this.createHash(data) === this.hash;
  }
}

export class ReferenceProgress {
  current: number = 0;
  length: number = 0;
}

/**
 * Download reference guides system to download the file.
 */
export interface DownloadReference {
  name: string;
  path: string;
  url: string;
  sum?: ReferenceChecksum; // Optional
  progress: ReferenceProgress; // System base
}

export class UrlDownloadReference implements DownloadReference {
  name: string;
  path: string;
  url: string;
  sum?: ReferenceChecksum;
  progress: ReferenceProgress;

  constructor(
    name: string,
    path: string,
    url: string,
    sum?: ReferenceChecksum
  ) {
    this.name = name;
    this.path = path;
    this.url = url;
    this.progress = new ReferenceProgress();
    this.sum = sum;
  }

  public static createFromPath(
    _path: string,
    url: string,
    sum?: ReferenceChecksum
  ) {
    let head = path.dirname(_path);
    let filename = path.basename(_path);

    return new UrlDownloadReference(filename, head, url, sum);
  }
}

export interface LaunchOptions {
  maxRetry?: number;
  onComplete?: (reference: DownloadReference) => void;
}

export class DownloadLaunchPad {
  private launchpad: Queue<DownloadReference> = new Queue();

  public async launch(launchOptions?: LaunchOptions): Promise<void> {
    if (this.launchpad.isEmpty()) {
      throw new Error(`Launchpad has not spaceship (queue is empty)`);
    }
    while (!this.launchpad.isEmpty()) {
      let _currentItem = this.launchpad.pop();

      this.download(_currentItem).then((reference: DownloadReference) => {
        // Execute onComplete
        if (launchOptions && launchOptions.onComplete) {
          launchOptions.onComplete(reference);
        }
      });
    }
  }

  private async download(
    _currentItem: DownloadReference
  ): Promise<DownloadReference> {
    return new Promise(async function callback(resolve, reject) {
      // Pipe a data from current stream
      let _data = await fetchStreamData(_currentItem);

      // Create a stream to pipe data
      let _path = path.join(_currentItem.path, _currentItem.name);

      printDownloadWorker(`Downloading (${_currentItem.url}) -> (${_path})`);

      //   Check if exists or not, unless exists, create a new one
      if (!fs.existsSync(_currentItem.path)) {
        fs.mkdirSync(_currentItem.path, { recursive: true });
      }

      // Update a size of file
      if (_currentItem.progress) {
        // console.log(_data.headers["content-length"]);

        _currentItem.progress.length = Number.parseInt(
          _data.headers["content-length"]
        );
      }

      // Create a WriteStream to write all data
      let _stream = fs.createWriteStream(_path, {
        highWaterMark: 1024 * 1024,
      });

      // Pipe the stream
      _data.data
        .on("error", (error) => {
          reject(error);
        })
        .on("data", (chunk) => {
          if (_currentItem.progress) {
            let _progress = _currentItem.progress;
            _progress.current += chunk.length;

            printDownloadWorker(
              `${chalk.grey(_currentItem.name)} ~ [${
                _progress.current <= _progress.length / 2
                  ? chalk.red(_progress.current)
                  : _progress.current <= _progress.length * (4 / 5)
                  ? chalk.yellow(_progress.current)
                  : chalk.green(_progress.current)
              }${chalk.gray(`/`)}${chalk.green(_progress.length)}]`
            );
          }
        })
        .pipe(_stream);

      _stream.on("finish", () => {
        if (_currentItem.sum) {
          let _ = fs.readFileSync(_path, { encoding: "utf-8" });
          printDownloadWorker(`Executing check-sum: `);
          printDownloadWorker(
            `Provide: ${chalk.bgYellow(_currentItem.sum.hash)}`
          );
          printDownloadWorker(
            `Target:  ${
              _currentItem.sum.checksum(_)
                ? chalk.bgGreen(_currentItem.sum.createHash(_))
                : chalk.bgRed(_currentItem.sum.createHash(_))
            }`
          );

          // Failed to checksum, try to download the file again and checksum
          if (!_currentItem.sum.checksum(_)) {
            reject(new Error("Failed to check sum"));
            // printDownloadWorker(`Failed to check sum`);
          } else {
            resolve(_currentItem);
          }
        } else {
          // Execute onComplete
          resolve(_currentItem);
        }
      });
    });
  }

  public addReference(reference: DownloadReference): DownloadReference {
    return this.launchpad.push(reference);
  }
}

export class LauncherDownLoadWorker {
  private static _launchpad: DownloadLaunchPad;

  public static getLaunchPad(): DownloadLaunchPad {
    if (this._launchpad == undefined) {
      this._launchpad = new DownloadLaunchPad();
    }
    return this._launchpad;
  }
}

function fetchStreamData(
  reference: DownloadReference
): Promise<AxiosResponse<stream.Readable>> {
  return AxiosStreamLoader.get(reference.url);
}

function printDownloadWorker(things: any) {
  console.log(
    `${chalk.gray(
      `[DownloadWorker] ${
        typeof things === "object" ? things.toString() : things
      }`
    )}`
  );
}

export function getLaunchpad() {
  return LauncherDownLoadWorker.getLaunchPad();
}
