import chalk from "chalk";
import {
  getLaunchpad as getDownloadWorker,
  LauncherDownLoadWorker,
  UrlDownloadReference,
} from "./LauncherDownloadWorker";
import fs from "fs";
import path from "path";

import {
  getLauncherAppData,
  getLauncherMetadata,
  isNetworkOnline,
} from "./Launcher";

// Update if the file is older than 15 minutes
const VERSION_MANIFEST_UPDATE_OFFSET = 1000 * 60 * 15;

export interface MinecraftManifestLatestVersion {
  release: string;
  snapshot: string;
}

export interface MinecraftManifestVersion {
  id: string;
  type: "snapshot" | "release";
  url: URL;
  time: Date;
  releaseTime: Date;
}

export interface MinecraftManifest {
  latest: MinecraftManifestLatestVersion;
  versions: MinecraftManifestVersion[];
}
type GameRuleAction = "allow" | "disallow";
type RuleOperatingSystem = {
  name: "windows" | "osx" | "";
  version?: string;
};

export interface MinecraftVersionGameArgumentRule {
  action: GameRuleAction;
  features: object;
}

export interface MinecraftVersionJVMArgumentRule {
  action: GameRuleAction;
  os: RuleOperatingSystem;
}
export interface MinecraftVersionArgument {
  game: [
    string | { rules: MinecraftVersionGameArgumentRule[]; value: string[] }
  ];
  jvm: [string | { rules: MinecraftVersionJVMArgumentRule[]; value: string[] }];
}

export interface MinecraftVersionMetadataAssetIndex {
  id: string;
  sha1: string;
  size: number;
  totalSize: number;
  url: URL;
}

export interface MinecraftVersionMetadataDownloadResource {
  sha1: string;
  size: number;
  url: string;
}
export interface MinecraftVersionMetadataDownload {
  client: MinecraftVersionMetadataDownloadResource;
  client_mappings: MinecraftVersionMetadataDownloadResource;
  server: MinecraftVersionMetadataDownloadResource;
  server_mappings: MinecraftVersionMetadataDownloadResource;
}

export interface MinecraftVersionMetadataJavaVersion {
  component: string;
  majorVersion: number;
}

export interface MinecraftVersionMetadataLibrary {
  downloads: {
    artifacts: {
      path: fs.PathLike | string;
      sha1: string;
      size: number;
      url: URL | string;
    };
  };
  name: string;
  rules?: {
    action: GameRuleAction;
    os: RuleOperatingSystem;
  };
}

export interface MinecraftVersionMetadata {
  arguments: MinecraftVersionArgument;
  assetIndex: MinecraftVersionMetadataAssetIndex;
  assets: string;
  complianceLevel: number;
  downloads: MinecraftVersionMetadataDownload;
  id: string;
  javaVersion: MinecraftVersionMetadataJavaVersion;
  libraries: MinecraftVersionMetadataLibrary[];
  logging: {
    client: {
      argument: string;
      file: {
        id: string;
        sha1: string;
        size: number;
        url: URL | string;
      };
      type: string;
    };
  };
  mainClass: string;
  minimumLauncherVersion: number;
  releaseTime: Date;
  time: Date;
  type: "release" | "snapshot";
}

/**
 * Retrieves launcher version path.
 *
 * @returns a path contains things that related to version
 */
export function getVersionDirectoryPath(): string {
  return path.join(getLauncherAppData(), `versions`);
}

/**
 * Retrieves launcher version manifest.
 *
 * @returns a path of version manifest file path
 */
export function getVersionManifestFilePath(): string {
  return path.join(
    getVersionDirectoryPath(),
    getLauncherMetadata().Filename.VersionManifest
  );
}

/**
 * Download the version manifest file
 */
function downloadManifestFile(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Make directory unless exist
    if (!fs.existsSync(getVersionDirectoryPath())) {
      fs.mkdirSync(getVersionDirectoryPath(), { recursive: true });
    }

    // Prepare for launch
    LauncherDownLoadWorker.getLaunchPad().addReference(
      new UrlDownloadReference(
        getLauncherMetadata().Filename.VersionManifest,
        getVersionDirectoryPath(),
        getLauncherMetadata().API.Url.MinecraftVersionManifestUrl
      )
    );

    // Download the file
    await LauncherDownLoadWorker.getLaunchPad().launch({
      onComplete() {
        console.log(
          chalk.green(`Successfully download the launcher version manifest`)
        );
        resolve();
      },
    });
  });
}

/**
 * Checks and updates if the manifest file is out of date.
 *
 * Updates method describe by fetching the the version manifest file from Mojang API.
 * Checks the file is old or not by using `fs.statsSync` and `mtime` method.
 *
 * The file will be downloaded by using LauncherDownloadWorker.
 *
 */
export async function updateManifestFile() {
  // Check the file whether is out of date
  if (fs.existsSync(getVersionManifestFilePath())) {
    let _stats = fs.statSync(getVersionManifestFilePath());

    if (Date.now() - _stats.mtime.getTime() > VERSION_MANIFEST_UPDATE_OFFSET) {
      return downloadManifestFile();
    }
    return;
  }

  // Download the version manifest file
  return downloadManifestFile();
}

/**
 * Retrieves a minecraft manifest in current file.
 * If the minecraft manifest file is not exists and network connection is failed,
 *  function will throw an error.
 *
 * @returns a minecraft manifest which parsed from JSON from version
 */
export async function getVersionManifest(): Promise<MinecraftManifest> {
  // If not exists the file and the network is not online
  if (!(fs.existsSync(getVersionManifestFilePath()) || isNetworkOnline())) {
    throw new Error(`Version manifest is not found and updatable`);
  }

  // Update the network file
  await updateManifestFile();

  // Return it
  return JSON.parse(fs.readFileSync(getVersionManifestFilePath(), "utf-8"));
}

export async function getVersionMetadataFilePath(versionId: string) {
  return path.join(
    getLauncherAppData(),
    getLauncherMetadata().Path.Version.Metadata,
    versionId.concat(".json")
  );
}

export async function getVersionMetadata(
  versionId: string
): Promise<MinecraftVersionMetadata> {
  let _filePath = await getVersionMetadataFilePath(versionId);
  // Create a directory unless found it
  if (!fs.existsSync(path.dirname(_filePath))) {
    fs.mkdirSync(path.dirname(_filePath), { recursive: true });
  }

  let _manifest = await getVersionManifest();
  let _version = _manifest.versions.find((version) => version.id === versionId);

  // Undefined version
  if (!_version) {
    throw new Error(`Minecraft version not found: ${versionId}`);
  }

  // If the file is not exist, download the version metadata
  if (!fs.existsSync(_filePath)) {
    console.log(
      UrlDownloadReference.createFromPath(_filePath, _version.url.toString())
    );

    // getDownloadWorker().addReference(

    // );

    // await getDownloadWorker().launch();
  }

  return JSON.parse(fs.readFileSync(_filePath, "utf-8"));
}
