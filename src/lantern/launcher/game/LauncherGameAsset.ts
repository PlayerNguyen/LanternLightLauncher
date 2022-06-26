import chalk from "chalk";
import {
  getLaunchpad,
  LauncherDownLoadWorker,
  ReferenceChecksumSHA1,
  UrlDownloadReference,
} from "./../LauncherDownloadWorker";
import { MinecraftVersionMetadata } from "./../LauncherVersion";
import { getVersionManifest } from "../LauncherVersion";
import path from "path";
import fs from "fs";
import { getLauncherAppData } from "../Launcher";

export async function buildGameFile(version: string) {
  // Build a launcher version manifest
  let _versionManifest = await getVersionManifest();

  // Looking for current version. If found, throw an error
  let _currentVersion = _versionManifest.versions.find(
    (_version) => _version.id === version
  );
  if (!_currentVersion) {
    throw new Error(`Unsupported version ${version}`);
  }

  // Build a game asset index

  // buildGameAsset(version, _ver);
}

async function buildGameAsset(
  version: string,
  metadata: MinecraftVersionMetadata
) {
  let _versionPath = await getGameAssetIndexFilePath(version);

  // Check if the current asset name is built
  if (!fs.existsSync(_versionPath)) {
    // Download asset index from metadata
    LauncherDownLoadWorker.getLaunchPad().addReference(
      UrlDownloadReference.createFromPath(
        _versionPath,
        metadata.assetIndex.url.toString(),
        new ReferenceChecksumSHA1(metadata.assetIndex.sha1)
      )
    );

    await getLaunchpad().launch({
      onComplete(reference) {
        console.log(chalk.green(`Successfully download asset index file.`));
      },
    });
  }

  // Then, download all resource indexes
  // TODO: download me
}

export async function getGameAssetIndexFilePath(version: string) {
  return path.join(getLauncherAppData(), "assets", version + ".json");
}

export async function getGameAssetDirectoryPath() {
  return path.join(getLauncherAppData(), "assets");
}
