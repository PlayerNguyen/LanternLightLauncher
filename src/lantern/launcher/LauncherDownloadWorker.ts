import chalk, { Chalk } from "chalk";
import path from "path";
import { AxiosResponse } from "axios";
import fs from "fs";
import { AxiosStreamLoader } from "./../utils/request/AxiosHelper";
import stream from "node:stream";
import { Queue } from "./../platforms/utils/queue/common/Queue";
import { createSha1 } from "../platforms/crypto/common/Crypto";
import pLimit from "p-limit";

import {
  isDevelopment,
  isTesting,
} from "../platforms/environment/common/Environment";

const MAX_DOWNLOAD_POOL_SIZE = 4;
const limit = pLimit(MAX_DOWNLOAD_POOL_SIZE);

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

  constructor(length?: number) {
    this.length = length ? length : 0;
  }
}

/**
 * Download reference guides system to download the file.
 */
export interface DownloadReference {
  name: string;
  path: string;
  url: string;
  size: number;
  sum?: ReferenceChecksum; // Optional
  progress: ReferenceProgress; // System base

  color: Chalk;
}

export class UrlDownloadReference implements DownloadReference {
  name: string;
  path: string;
  url: string;

  sum?: ReferenceChecksum;
  progress: ReferenceProgress;

  size: number = 0;
  color: Chalk;

  constructor(
    name: string,
    path: string,
    url: string,
    size?: number,
    sum?: ReferenceChecksum
  ) {
    this.name = name;
    this.path = path;
    this.url = url;
    this.progress = new ReferenceProgress(size);
    this.sum = sum;

    if (chalk.level <= 2) {
      let bg = [
        chalk.bgBlue,
        chalk.bgCyan,
        chalk.bgGreenBright,
        chalk.bgGreen,
        chalk.bgYellow,
      ];
      this.color = bg[Math.floor(Math.random() * bg.length)];
    } else {
      const genRandom = () => Math.floor(Math.random() * 256);
      this.color = chalk.rgb(genRandom(), genRandom(), genRandom());
    }
  }

  public static createFromPath(
    _path: string,
    url: string,
    size?: number,
    sum?: ReferenceChecksum
  ) {
    let head = path.dirname(_path);
    let filename = path.basename(_path);

    return new UrlDownloadReference(filename, head, url, size, sum);
  }
}

export interface LaunchOptions {
  maxRetry?: number;
  onComplete?: (reference: DownloadReference) => void;
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

/**
 * @deprecated using LauncherWorker with async instead because it going
 *  to be crash or un-resolved after finished download
 */
export class DownloadLaunchPad {
  private launchpad: Queue<DownloadReference> = new Queue();

  public async launch(launchOptions?: LaunchOptions) {
    if (this.launchpad.isEmpty()) {
      throw new Error(`Launchpad has not spaceship (queue is empty)`);
    }
    while (!this.launchpad.isEmpty()) {
      try {
        let _currentItem = this.launchpad.pop();

        await this.download(_currentItem);

        // Execute onComplete
        if (launchOptions && launchOptions.onComplete) {
          launchOptions.onComplete(_currentItem);
        }
      } catch {
        break;
      }
    }
  }

  private async download(_currentItem: DownloadReference) {
    return new Promise(async (res, rej) => {
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
      let _pipeStream = _data.data
        .on("error", (error) => {
          rej(error);
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

      _pipeStream.on("finish", () => {
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
            printDownloadWorker(`Failed to check sum`);
            rej(new Error(`Failed to check sum`));
          } else {
            res(_currentItem);
          }
        } else {
          res(_currentItem);
        }
      });
    });
  }

  public addReference(reference: DownloadReference): DownloadReference {
    return this.launchpad.push(reference);
  }
}

export class DownloadWorker {
  private static instance?: DownloadWorker = undefined;
  private pendingItems: DownloadReference[] = [];

  public static getInstance() {
    if (this.instance === undefined) {
      this.instance = new DownloadWorker();
    }

    return this.instance;
  }

  public push(ref: DownloadReference): DownloadWorker {
    this.pendingItems.push(ref);
    return this;
  }

  public pushAll(...refs: DownloadReference[]): DownloadWorker {
    for (let i = 0; i < refs.length; i++) {
      this.push(refs[i]);
    }
    return this;
  }

  public downloadAllPendingItems(config?: {
    onData?: (ref: DownloadReference, data: any) => void;
  }): Promise<DownloadReference[]> {
    let _cacheItems = [...this.pendingItems];
    this.pendingItems = [];

    return Promise.all([
      ..._cacheItems.map((item) =>
        limit(async () => await this.download(item, { onData: config?.onData }))
      ),
    ]);
  }

  public async download(
    ref: DownloadReference,
    config?: { onData?: (ref: DownloadReference, data: any) => void }
  ): Promise<DownloadReference> {
    // Remove it out of the download reference
    if (this.pendingItems.includes(ref)) {
      console.log(this.pendingItems);

      this.pendingItems = this.pendingItems.filter((_ref) => _ref !== ref);
    }
    // Then return a promise
    return new Promise(async (fulfill, reject) => {
      try {
        // Fetch the data as stream from AxiosStreamLoader
        let response = await fetchStreamData(ref);

        // Resolve file path by merge path and name together
        let filePath = path.join(ref.path, ref.name);

        // Make a dir if the dirname is not found
        if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Update size if the size is zero
        if (!ref.size || ref.size === 0) {
          ref.progress.length = parseInt(response.headers["content-length"]);
        }

        // Update a length of data into a class

        // Pipe it into a write stream
        let writeStream = response.data
          .on("error", (error) => {
            reject(error);
          })
          .on("data", (chunk: any) => {
            ref.progress.current += chunk.length;
            // console.log(ref.color);

            if (ref.progress.current % 100 == 0) {
              printDownloadWorker(
                `(${ref.color(ref.name)}) [${chalk.yellow(
                  ref.progress.current
                )}/${chalk.green(ref.progress.length)}]`
              );
            }

            // Call event
            if (config && config.onData) config.onData(ref, chunk);
          })
          .pipe(fs.createWriteStream(filePath, { highWaterMark: 1024 * 1024 }));

        // On finish, resolve the promise
        writeStream.on("finish", () => {
          fulfill(ref);
        });
      } catch (error) {
        return reject(error);
      }
    });
  }
}

export function getDownloadWorker() {
  return DownloadWorker.getInstance();
}
