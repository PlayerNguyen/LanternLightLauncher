import chalk from "chalk";
import {
  createSha1CheckSum,
  getDownloadWorker,
  UrlDownloadReference,
} from "./LauncherDownloadWorker";
import {
  getVersionDirectoryPath,
  getVersionMetadata,
  MinecraftVersionMetadata,
} from "./LauncherVersion";
import { getVersionManifest } from "./LauncherVersion";
import path from "path";
import fs from "fs";
import { getLauncherAppData, getLauncherMetadata } from "./Launcher";
import {
  isLinux,
  isMacOS,
  isWindows,
} from "../platforms/environment/common/Environment";
import child from "child_process";

import {
  buildGameAssets,
  buildGameDownloadJar,
  buildGameLibraries,
  buildJavaRuntime,
  buildLoggingConfiguration,
  LibraryParser,
} from "./GameBuilder";

export async function launchMinecraft(
  version: string,
  username: string,
  uuid?: string
) {
  try {
    // Build a game arguments
    let metadata = await getVersionMetadata(version);

    // Build the game file
    await buildGameFile(version);

    let _cp = LibraryParser.getRuntimeLibraries(metadata.libraries)
      .concat([
        path.join(
          getVersionFromIdDirectoryPath(version),
          version.concat(".jar")
        ),
      ])
      .join(path.delimiter);

    uuid = uuid ? uuid : "";
    let _natives = `/Users/nguyen/Library/Application Support/Lantern_Testing/libraries/org/lwjgl/lwjgl/lwjgl`;
    // if (!fs.existsSync(_natives)) {
    //   fs.mkdirSync(_natives, { recursive: true });
    // }

    let launchArgs = [
      `-XstartOnFirstThread`,
      // `-Dlog4j.configurationFile=${path.join(
      //   getAssetLogConfigsDirectoryPath(),
      //   path.basename(metadata.logging.client.file.url.toString())
      // )}`,
      "-Dorg.lwjgl.util.Debug=true",
      `-Djava.library.path="${_natives}"`,
      "-Dminecraft.launcher.brand=LanternLightLauncher",
      "-Dminecraft.launcher.version=1.0.0",

      "-cp",
      `${_cp}`,
      `${metadata.mainClass}`,

      `--username`,
      username,

      `--version`,
      version,

      `--accessToken`,
      `null`,

      `--userType`,
      `mojang`,

      `--gameDir`,
      getLauncherAppData(),

      // asset root
      `--assetsDir`,
      getGameAssetDirectoryPath(),

      // Asset index name
      `--assetIndex`,
      metadata.assetIndex.id,

      `--versionType`,
      metadata.type,

      `--uuid`,
      uuid,
      `--clientId`,
      ``,

      `--xuid`,
      `null`,
    ];
    // console.log(launchArgs);

    let process = child.spawnSync(getDownloadedRuntimeJavaHome(), launchArgs);
    console.log(process);

    console.log(process.stderr && process.stderr.toString());
    console.log(process.stdout && process.stdout.toString());

    fs.mkdirSync(getLauncherLoggingDirectoryPath(), {
      recursive: true,
    });

    // fs.createWriteStream(
    //   path.join(getLauncherLoggingDirectoryPath(), "latest.txt")
    // ).write(process);

    console.log(`Process status: ${process.status}`);
    return process;
  } catch (err) {
    throw err;
  }
}

export async function buildGameFile(version: string) {
  console.log(`Building game file...`);

  // Build a launcher version manifest
  let _versionManifest = await getVersionManifest();

  // Looking for current version. Unless found, throw an error
  let _currentVersion = _versionManifest.versions.find(
    (_version) => _version.id === version
  );
  if (!_currentVersion) {
    throw new Error(`Unsupported version ${version}`);
  }

  let _metadata = await getVersionMetadata(version);

  // Build Java Runtime
  await buildJavaRuntime(_metadata.javaVersion.majorVersion);

  // Build game library
  await buildGameLibraries(version);

  // Build a game asset index
  await buildGameAssets(version);

  // Build log configs
  await buildLoggingConfiguration(version);

  // Build game class
  await buildGameDownloadJar(version);
}

export function getDownloadedRuntimeDirPath() {
  return path.join(getLauncherAppData(), getLauncherMetadata().Path.Runtime);
}

export function getDownloadedRuntimeJavaHome() {
  return path.join(
    getDownloadedRuntimeFilePath(),
    isMacOS()
      ? path.join(`Contents`, `Home`, `bin`, `java`)
      : path.join(`bin`, `java`)
  );
}

export function getDownloadedRuntimeFilePath() {
  return path.join(
    getDownloadedRuntimeDirPath(),
    isMacOS() ? `runtime.bundle` : `runtime`
  );
}

export function getVersionFromIdDirectoryPath(version: string) {
  return path.join(getVersionDirectoryPath(), version);
}

export function getGameAssetIndexFilePath(version: string) {
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
) {
  let _assetIndexRef = metadata.assetIndex;
  let _filePath = getGameAssetIndexFilePath(_assetIndexRef.id);

  // Check if the indexes is available or not
  if (!fs.existsSync(_filePath)) {
    // Download the game indexes from Mojang API server into launcher data folder
    let _downloadReference = UrlDownloadReference.createFromPath(
      _filePath,
      _assetIndexRef.url.toString(),
      _assetIndexRef.size,
      createSha1CheckSum(_assetIndexRef.sha1)
    );

    // Download the indexes file
    await getDownloadWorker()
      .push(_downloadReference)
      .downloadAllPendingItems();
  }

  return JSON.parse(fs.readFileSync(_filePath, "utf-8"));
}

export function getGameLibrariesDirectoryPath() {
  return path.join(getLauncherAppData(), `libraries`);
}

export function getAssetLogConfigsDirectoryPath() {
  return path.join(getGameAssetDirectoryPath(), `log_configs`);
}

export function getLauncherLoggingDirectoryPath() {
  return path.join(
    getLauncherAppData(),
    getLauncherMetadata().Path.LauncherLogs
  );
}
