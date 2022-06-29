import chalk from "chalk";
import {
  getDownloadWorker,
  ReferenceChecksumSHA1,
  UrlDownloadReference,
} from "./../LauncherDownloadWorker";
import {
  getVersionMetadata,
  MinecraftVersionMetadata,
} from "./../LauncherVersion";
import { getVersionManifest } from "../LauncherVersion";
import path from "path";
import fs from "fs";
import { getLauncherAppData, getLauncherMetadata } from "../Launcher";

export async function buildGameFile(version: string) {
  // Build a launcher version manifest
  let _versionManifest = await getVersionManifest();

  // Looking for current version. Unless found, throw an error
  let _currentVersion = _versionManifest.versions.find(
    (_version) => _version.id === version
  );
  if (!_currentVersion) {
    throw new Error(`Unsupported version ${version}`);
  }

  // Build a game asset index
  await buildGameAsset(version);
}

async function buildGameAsset(version: string) {
  let metadata = await getVersionMetadata(version);

  // Then, get game asset indexes
  let gameIndexes = await getGameIndexesFromMetadata(metadata);

  gameIndexes.objects
    .map((_object) => {
      let currentPath = path.join(
        getGameAssetObjectDirectoryPath(),
        _object.hash.substring(0, 2),
        _object.hash
      );
      let { hash, name, size } = _object;
      return {
        url: path.join(_object.hash.substring(0, 2), _object.hash),
        path: currentPath,
        hash,
        name,
        size,
      };
    })
    .map((_object) => {
      let _reference = UrlDownloadReference.createFromPath(
        _object.path,
        new URL(
          _object.url,
          getLauncherMetadata().API.Url.ResourceDownloadAPI
        ).toString(),
        _object.size,
        new ReferenceChecksumSHA1(_object.hash)
      );
      return _reference;
    })
    .filter((o) => !fs.existsSync(o.path))
    .forEach((ref) => {
      getDownloadWorker().push(ref);
    });

  let _ = await getDownloadWorker().downloadAllPendingItems();
  if (_.length > 0) {
    console.log(chalk.green(`Successfully download ${_.length} items`));
  } else {
    console.log(chalk.green(`The asset objects already up-to-date`));
  }
}

export async function getGameAssetIndexFilePath(version: string) {
  return path.join(getGameAssetDirectoryPath(), "indexes", version + ".json");
}

export function getGameAssetDirectoryPath() {
  return path.join(getLauncherAppData(), "assets");
}

export function getGameAssetObjectDirectoryPath() {
  return path.join(getGameAssetDirectoryPath(), `objects`);
}

export async function getGameIndexesFromMetadata(
  metadata: MinecraftVersionMetadata
): Promise<{ objects: [{ name: string; hash: string; size: number }] }> {
  let _assetIndexRef = metadata.assetIndex;
  let _filePath = await getGameAssetIndexFilePath(_assetIndexRef.id);

  // Check if the indexes is available or not
  if (!fs.existsSync(_filePath)) {
    // Download it
    let _downloadReference = UrlDownloadReference.createFromPath(
      _filePath,
      _assetIndexRef.url.toString(),
      _assetIndexRef.size,
      new ReferenceChecksumSHA1(_assetIndexRef.sha1)
    );

    // Download the indexes file
    let _ref = await getDownloadWorker().download(_downloadReference);
    let __path = path.join(_ref.path, _ref.name);

    // Sanitize things for the first download
    // And then just read it as utf-8 encoding
    let _unsanitized: { objects: any } = JSON.parse(
      fs.readFileSync(__path, "utf-8")
    );
    // Let sanitize this object
    let _sanitized: any = {
      objects: [],
    };
    for (let key in _unsanitized.objects) {
      // let _name = _unsanitized.objects[key];
      let _refined = {
        name: key,
        hash: _unsanitized.objects[key]["hash"],
        size: _unsanitized.objects[key]["size"],
      };
      _sanitized.objects.push(_refined);
    }

    // Write it into a current file
    fs.writeFileSync(__path, JSON.stringify(_sanitized, null, 0), {
      encoding: "utf-8",
      flag: "w+",
    });
  }

  return JSON.parse(fs.readFileSync(_filePath, "utf-8"));
}
