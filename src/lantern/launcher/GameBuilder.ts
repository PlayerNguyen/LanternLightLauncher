import chalk from "chalk";

import os from "os";
import fs from "fs";
import decompress from "@xingrz/decompress";
import dTarGz from "@xingrz/decompress-targz";
import dUnzip from "@xingrz/decompress-unzip";

import {
  GameRuleAction,
  getVersionMetadata,
  MinecraftVersionArgument,
  MinecraftVersionMetadataLibrary,
  RuleOperatingSystem,
} from "./LauncherVersion";
import { AxiosJsonLoader } from "./../utils/request/AxiosHelper";
import {
  createSha1CheckSum,
  DownloadReference,
  getDownloadWorker,
  ReferenceHashSha256,
  UrlDownloadReference,
} from "./LauncherDownloadWorker";

import {
  getAssetLogConfigsDirectoryPath,
  getDownloadedRuntimeDirPath,
  getDownloadedRuntimeFilePath,
  getGameAssetObjectDirectoryPath,
  getGameIndexesFromMetadata,
  getGameLibrariesDirectoryPath,
  getVersionFromIdDirectoryPath,
} from "./LauncherGameAsset";
import path from "path";

import {
  fetchJavaRuntimeVersion,
  getCurrentJavaRuntimeVersion,
} from "./LauncherJavaRuntime";

import {
  isLinux,
  isMacOS,
  isWindows,
} from "../platforms/environment/common/Environment";
import { getLauncherMetadata } from "./Launcher";

/**
 * Checks and downloads java runtime.
 *  If current system do not have any JRE, download a newest one with current arch
 *  If the JRE is existed, test if the current major version is greater than current
 *    If current > newest, skip
 *    Else
 *      If currentRuntime of launcher == newest, skip
 *      Else Download()
 * @param majorVersionId a major version id of java runtime to test and download
 */
export async function buildJavaRuntime(majorVersionId: number) {
  // If the system has no java runtime
  let systemVersion = getCurrentJavaRuntimeVersion();
  console.log(`System Java Runtime: `, systemVersion);
  if (
    !systemVersion ||
    (systemVersion.major &&
      Number.parseInt(systemVersion.major) < majorVersionId)
  ) {
    // Require download the the newest version
    // https://api.adoptium.net/v3/info/available_releases
    // Priority to download the most recent. If the latest minecraft version require higher than the most recent, download a minecraft newest major

    let releaseObject = await AxiosJsonLoader.get<{
      available_lts_releases: number[];
      available_releases: number[];
      most_recent_feature_release: number;
      most_recent_feature_version: number;
      most_recent_lts: number;
      tip_version: number;
    }>("https://api.adoptium.net/v3/info/available_releases");

    let shouldDownloadVersion =
      releaseObject.data.most_recent_lts > majorVersionId
        ? releaseObject.data.most_recent_lts
        : majorVersionId;

    let response = (await fetchJavaRuntimeVersion(shouldDownloadVersion)).data;
    if (response.length == 0) {
      throw new Error(`Unspecific system or unable to fetch runtime version `);
    }

    console.info(
      `Building runtime with major version ${shouldDownloadVersion}`
    );

    // Download the runtime
    let downloadObject = response[0];
    let fileName = downloadObject.binary.package.name;
    let fileLocation = path.join(getDownloadedRuntimeDirPath(), fileName);

    if (!fs.existsSync(fileLocation)) {
      let hash = new ReferenceHashSha256(
        downloadObject.binary.package.checksum
      );
      let size = downloadObject.binary.package.size;
      let url = downloadObject.binary.package.link;

      await getDownloadWorker()
        .push(
          UrlDownloadReference.createFromPath(fileLocation, url, size, hash)
        )
        .downloadAllPendingItems({ verbose: true });
    }

    let runtimeOutput = getDownloadedRuntimeFilePath();
    console.log(`runtimeOutput: `, runtimeOutput);

    // Extract the runtime and rename it
    await decompress(fileLocation, getDownloadedRuntimeDirPath(), {
      plugins: fileName.includes(".tar.gz") ? [dTarGz()] : [dUnzip()],
    });

    // Rename into a version
    let _extractUnsanitizedFile = path.join(
      getDownloadedRuntimeDirPath(),
      fs
        .readdirSync(getDownloadedRuntimeDirPath())
        .filter((name) => name.includes("jdk-"))[0]
    );

    fs.renameSync(_extractUnsanitizedFile, runtimeOutput);
    // Then remove archive file
    fs.rmSync(fileLocation, { force: true, recursive: true });
    return;
  }

  console.info(`Java Runtime Environment is updated. Skipped build runtime`);
}

/**
 * Checks and downloads game jars in metadata.downloads if it is not exist.
 * The built file will be downloaded into ~/%launcher_path%/versions/%version%/%version%.jar
 *
 * @param version a version of Minecraft to build a jar files
 */
export async function buildGameDownloadJar(version: string) {
  let metadata = await getVersionMetadata(version);
  // Downloads classes file
  let downloads = metadata.downloads;
  // Check the client client
  let _path = path.join(
    getVersionFromIdDirectoryPath(version),
    version.concat(`.jar`)
  );
  if (!fs.existsSync(_path)) {
    // Start to download the client file
    let { sha1, size, url } = downloads.client;
    getDownloadWorker().push(
      UrlDownloadReference.createFromPath(
        _path,
        url,
        size,
        createSha1CheckSum(sha1)
      )
    );

    await getDownloadWorker().downloadAllPendingItems();
  }
}

/**
 *  Checks and downloads logging configuration for current version.
 *
 * @param version a Minecraft version as literal to download.
 */
export async function buildLoggingConfiguration(version: string) {
  let metadata = await getVersionMetadata(version);

  // Download client xml file
  let file = metadata.logging.client.file;
  let _actualPath = path.join(
    getAssetLogConfigsDirectoryPath(),
    path.basename(metadata.logging.client.file.url.toString())
  );
  if (!fs.existsSync(_actualPath)) {
    // Push to the download queue
    getDownloadWorker().push(
      UrlDownloadReference.createFromPath(
        _actualPath,
        file.url.toString(),
        file.size,
        createSha1CheckSum(file.sha1)
      )
    );

    // Start to download
    getDownloadWorker().downloadAllPendingItems();
  }
}

/**
 * Checks and downloads if the game assets is it not exists
 * The game assets stored inside `./assets/objects/...`
 *
 * @param version a Minecraft version to build
 */
export async function buildGameAssets(version: string) {
  let metadata = await getVersionMetadata(version);

  // Then, get game asset indexes
  let gameIndexes = await getGameIndexesFromMetadata(metadata);
  let assets = [];
  for (let object in gameIndexes.objects) {
    const { hash, size }: { hash: string; size: number } =
      gameIndexes.objects[object];
    const _basenamePath = path.join(hash.substring(0, 2), hash);
    assets.push({
      hash,
      size,
      path: path.join(getGameAssetObjectDirectoryPath(), _basenamePath),
      url: _basenamePath,
    });
  }

  let _downloadContent = assets.filter((asset) => {
    return !fs.existsSync(asset.path);
  });

  // Put to queue
  _downloadContent.forEach((asset) => {
    getDownloadWorker().push(
      UrlDownloadReference.createFromPath(
        asset.path,
        new URL(
          asset.url,
          getLauncherMetadata().API.Url.ResourceDownloadAPI
        ).toString(),
        asset.size,
        createSha1CheckSum(asset.hash)
      )
    );
  });

  console.log(`Preparing for downloading ${_downloadContent.length} files`);

  let _ = await getDownloadWorker().downloadAllPendingItems();
  if (_.length > 0) {
    console.log(chalk.green(`Successfully download ${_.length} items`));
  } else {
    console.log(chalk.green(`The asset objects already up-to-date`));
  }
}

/**
 * Checks and downloads all library files from specific Minecraft version.
 *
 * @param version a Minecraft version to build library files
 */
export async function buildGameLibraries(version: string) {
  let metadata = await getVersionMetadata(version);

  // Build and download a environment for operation system
  let _compatibleLibraries = LibraryParser.getCompatibleLibraries(
    metadata.libraries
  );

  // Download all compatible libraries
  getDownloadWorker().pushAll(
    LibraryParser.createDownloadReferences(_compatibleLibraries).filter(
      (_) => !fs.existsSync(path.join(_.path, _.name))
    )
  );

  let response = await getDownloadWorker().downloadAllPendingItems();
  if (response.length > 0) {
    console.log(
      chalk.green(`Successfully download ${response.length} libraries`)
    );
  } else console.log(chalk.green(`The game libraries are up-to-date`));
}

/**
 * Represents a parser for rules in every kinds of things in metadata
 */
export class RuleParser {
  public static assertPlatform(_os?: RuleOperatingSystem) {
    let acceptVersion = true;
    if (_os?.version) {
      let regexTest = new RegExp(_os.version);
      acceptVersion = regexTest.test(os.release());
    }

    let acceptPlatformName = true;
    if (_os?.name) {
      switch (_os.name) {
        case "osx": {
          acceptPlatformName = isMacOS();
          break;
        }
        case "linux": {
          acceptPlatformName = isLinux();
          break;
        }
        case "windows": {
          acceptPlatformName = isWindows();
          break;
        }
        default: {
          throw new Error(`Unexpected operating system name ${_os.name}`);
        }
      }
    }

    let acceptPlatformArchitecture = true;
    if (_os?.arch) {
      switch (_os.arch) {
        case "x64": {
          acceptPlatformArchitecture = process.arch === "x64";
          break;
        }
        case "x86": {
          acceptPlatformArchitecture =
            process.arch === "arm" || process.arch === "ia32";
          break;
        }
        default: {
          throw new Error(`Unexpected architecture platform ${_os.arch}`);
        }
      }
    }

    return acceptPlatformName && acceptPlatformArchitecture && acceptVersion;
  }

  public static isAllow(
    rules?: [
      {
        action: GameRuleAction;
        os?: RuleOperatingSystem;
      }
    ]
  ) {
    if (!rules) {
      return true;
    }
    // If exists, go to next and check if allow on current os
    // console.log(lib.rules);
    let predicate = rules.map((rule) => {
      let actionCond = rule.action == "allow" ? true : false;
      let osCond = !rule.os ? true : this.assertPlatform(rule.os);
      // console.log(`-->`, actionCond && osCond);

      return actionCond && osCond;
    });
    // console.log(
    //   predicate,
    //   `->`,
    //   predicate.every((x) => x)
    // );

    return predicate.every((criteria) => criteria == true);
  }
}

/**
 * Represents a library json parser to parse all condition from
 * library blocks
 */
export class LibraryParser {
  public static getCompatibleLibraries(
    libraries: MinecraftVersionMetadataLibrary[]
  ): MinecraftVersionMetadataLibrary[] {
    return libraries.filter((lib) => {
      return RuleParser.isAllow(lib.rules);
    });
  }

  /**
   *  Transforms a libraries object to a download references.<br>
   *
   *  The libraries must be compatible and the path of the reference
   *     is non-exists
   *
   * @param libraries a libraries list to transform
   * @returns a list of reference file (non-exist) to download
   */
  public static createDownloadReferences(
    libraries: MinecraftVersionMetadataLibrary[]
  ) {
    let refs: DownloadReference[] = [];
    this.getCompatibleLibraries(libraries).forEach((lib) => {
      if (lib.natives && lib.downloads.classifiers) {
        let currentNative = isLinux()
          ? lib.natives.linux
          : isMacOS()
          ? lib.natives.osx
          : lib.natives.windows;

        // console.log(lib);
        // console.log(`current natives`, currentNative);

        if (currentNative) {
          // throw new Error(`Natives not found ${currentNative}`);
          let classifier = lib.downloads.classifiers[currentNative];
          // console.log(`classifier`, classifier);

          let _path = path.join(
            getGameLibrariesDirectoryPath(),
            classifier.path.toString()
          );

          let ref = UrlDownloadReference.createFromPath(
            _path,
            classifier.url.toString(),
            classifier.size,
            createSha1CheckSum(classifier.sha1)
          );
          refs = [...refs, ref];
        } else {
          console.warn(chalk.yellow(`lib.natives is undefined`));
        }
      }

      if (lib.downloads.artifact) {
        let artifact = lib.downloads.artifact;

        let _path = path.join(
          getGameLibrariesDirectoryPath(),
          artifact.path.toString()
        );
        let ref = UrlDownloadReference.createFromPath(
          _path,
          artifact.url.toString(),
          artifact.size,
          createSha1CheckSum(artifact.sha1)
        );
        refs = [...refs, ref];
      }
    });

    return refs;
  }

  public static getRuntimeLibraries(
    libraries: MinecraftVersionMetadataLibrary[]
  ) {
    console.log(
      this.createDownloadReferences(libraries).map((ref) => {
        return path.join(ref.path, ref.name);
      })
    );

    return this.createDownloadReferences(libraries).map((ref) => {
      return path.join(ref.path, ref.name);
    });
  }
}

export class ArgumentParser {
  public static fromArguments(args: any) {
    let argumentBuilder: string[] = [];

    // Build the argument for runtime first O(n)
    args.jvm.forEach((_object: any) => {
      if (typeof _object === "string") {
        argumentBuilder = [...argumentBuilder, _object];
      }

      // Other type is GameRule
      else if (
        typeof _object === "object" &&
        RuleParser.isAllow(_object.rules)
      ) {
        if (Array.isArray(_object.value)) {
          argumentBuilder = [...argumentBuilder, ..._object.value];
        } else {
          argumentBuilder = [...argumentBuilder, _object.value];
        }
      }
    });

    // Build the game argument O(n)
    args.game.forEach((gameArgument: any) => {
      if (typeof gameArgument === "string") {
        argumentBuilder = [...argumentBuilder, gameArgument];
      }
    });

    return argumentBuilder;
  }
}

export class GameBuilder {}
