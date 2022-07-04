import chalk, { Chalk } from "chalk";
import path from "path";
import { AxiosResponse } from "axios";
import fs from "fs";
import { AxiosStreamLoader } from "../utils/request/AxiosHelper";
import stream from "stream";
import pLimit from "p-limit";

import crypto, { createHash } from "crypto";

const MAX_DOWNLOAD_POOL_SIZE = 12;
const limit = pLimit(MAX_DOWNLOAD_POOL_SIZE);

export class ReferenceProgress {
  current: number = 0;
  length: number = 0;

  constructor(length?: number) {
    this.length = length ? length : 0;
  }
}

export abstract class ReferenceHash {
  providedHash: string | crypto.BinaryLike;
  hash: crypto.Hash;

  private algorithm: string;
  private config?: crypto.HashOptions;

  constructor(
    providedHash: string | crypto.BinaryLike,
    algorithm: string,
    config?: crypto.HashOptions
  ) {
    this.providedHash = providedHash;
    this.algorithm = algorithm;
    this.config = config;

    this.hash = createHash(algorithm, config);
  }

  public update(data: crypto.BinaryLike) {
    return this.hash.update(data);
  }

  public digest(encoding: crypto.BinaryToTextEncoding): string {
    return this.hash.digest(encoding);
  }

  public compareWithProvidedHash(): boolean {
    return this.digest("hex") === this.providedHash;
  }

  public reset() {
    this.hash = createHash(this.algorithm, this.config);
  }
}

export class ReferenceHashSha1 extends ReferenceHash {
  constructor(providedHash: string | crypto.BinaryLike) {
    super(providedHash, "sha1");
  }
}

export class ReferenceHashSha256 extends ReferenceHash {
  constructor(providedHash: string | crypto.BinaryLike) {
    super(providedHash, "sha256");
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

  progress: ReferenceProgress; // System base
  hash?: ReferenceHash;
  color: Chalk;
  retryCount: number;
}

export class UrlDownloadReference implements DownloadReference {
  name: string;
  path: string;
  url: string;

  progress: ReferenceProgress;
  hash?: ReferenceHash;

  size: number = 0;
  color: Chalk;
  retryCount = 0;
  constructor(
    name: string,
    path: string,
    url: string,
    size?: number,
    hash?: ReferenceHash
  ) {
    this.name = name;
    this.path = path;
    this.url = url;
    this.progress = new ReferenceProgress(size);
    // this.sum = sum;
    this.hash = hash;

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
    hash?: ReferenceHash
  ) {
    let head = path.dirname(_path);
    let filename = path.basename(_path);

    return new UrlDownloadReference(filename, head, url, size, hash);
  }
}

export interface DownloadOptions {
  maxRetry?: number;
  onData?: (ref: DownloadReference, data: any) => void;
  verbose?: false | boolean;
}

function fetchStreamData(
  reference: DownloadReference
): Promise<AxiosResponse<stream.Readable>> {
  return AxiosStreamLoader.get(reference.url);
}

export function printDownloadWorker(things: any) {
  console.log(
    `${chalk.gray(
      `[DownloadWorker] ${
        typeof things === "object" ? JSON.stringify(things, null, 2) : things
      }`
    )}`
  );
}

export function createSha1CheckSum(hash: string) {
  return new ReferenceHashSha1(hash);
}

export function createSha256Checksum(hash: string) {
  return new ReferenceHashSha256(hash);
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

  public pushAll(refs: DownloadReference[]): DownloadWorker {
    this.pendingItems = [...this.pendingItems, ...refs];
    return this;
  }

  public downloadAllPendingItems(
    config?: DownloadOptions
  ): Promise<DownloadReference[]> {
    let _cacheItems = [...this.pendingItems];
    this.pendingItems = [];

    return Promise.all([
      ..._cacheItems.map((item) =>
        limit(async () => await this.download(item, config))
      ),
    ]);
  }

  public async download(
    ref: DownloadReference,
    config?: DownloadOptions
  ): Promise<DownloadReference> {
    // Remove it out of the download reference
    if (this.pendingItems.includes(ref)) {
      this.pendingItems = this.pendingItems.filter((_ref) => _ref !== ref);
    }

    printDownloadWorker(`Downloading ${path.join(ref.path, ref.name)} file`);

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

    let writeStream = fs.createWriteStream(filePath);

    // Pipe it into a write stream
    let readStream = response.data.on("data", (chunk: any) => {
      ref.progress.current += chunk.length;
      // console.log(ref.color);

      if (
        config?.verbose &&
        (ref.progress.current % 10 == 0 ||
          ref.progress.current === ref.progress.length)
      ) {
        printDownloadWorker(
          `(${ref.color(ref.name)}) [${chalk.yellow(
            ref.progress.current
          )}/${chalk.green(ref.progress.length)}] ${
            ref.progress.current === ref.progress.length
              ? chalk.bgGreen(`[finished]`)
              : ``
          }`
        );
      }

      // Call event
      if (config && config.onData) config.onData(ref, chunk);
    });

    const promisePipeWrite = new Promise<void>((res, rej) => {
      stream.pipeline(readStream, writeStream, (err) => {
        if (err) rej();
        else res();
      });
    });

    // On finish, resolve the promise
    // writeStream.on("finish", () => {
    //   console.log(
    //     `Finished download ${ref.color(path.join(ref.path, ref.name))}`
    //   );

    //   fulfill(ref);
    // });

    // After finished writing things, start to check hash of the file
    const promiseHashChecker = new Promise<boolean>((res, rej) => {
      promisePipeWrite
        .then(() => {
          if (!ref.hash) {
            return res(true);
          }

          let _d = fs.createReadStream(filePath);
          _d.on("data", (chunk) => {
            if (ref.hash) ref.hash.update(chunk);
          })
            .on("close", () => {
              if (ref.hash) res(ref.hash.compareWithProvidedHash());
              else res(true);
            })
            .on("error", (err) => rej(err));
        })
        .catch(rej);
    });

    let resultPromise = new Promise<DownloadReference>((res, rej) => {
      let maxAttempt = (config && config.maxRetry) || 3;
      promiseHashChecker.then((isValidated) => {
        if (!isValidated) {
          if (ref.retryCount < maxAttempt) {
            ref.retryCount++;

            // Reset a hash and length count
            ref.hash?.reset();
            ref.progress.current = 0;

            // If verbose, show the warning
            if (config?.verbose) {
              printDownloadWorker(
                chalk.red(
                  `Failed to checksum ${ref.name}, trying to download again [attempt (${ref.retryCount} / ${maxAttempt})]`
                )
              );
            }

            // Attempt to download again
            this.download(ref, config);
          } else {
            // Remove the file
            fs.rmSync(filePath);
            return rej(new Error("Invalid sum hash or data was incorrect"));
          }
        } else {
          res(ref);
        }
      });
    });

    return resultPromise;
  }
}

export function getDownloadWorker() {
  return DownloadWorker.getInstance();
}
