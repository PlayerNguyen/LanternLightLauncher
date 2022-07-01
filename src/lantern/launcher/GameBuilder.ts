import { DownloadReference } from "./../../lantern/launcher/LauncherDownloadWorker";
import chalk from "chalk";

import os from "os";
import { MinecraftVersionMetadataLibrary } from "./LauncherVersion";
import { AxiosJsonLoader } from "./../utils/request/AxiosHelper";
import {
  createSha1CheckSum,
  getDownloadWorker,
  ReferenceHashSha256,
  UrlDownloadReference,
} from "./LauncherDownloadWorker";
import {
  getDownloadedRuntimeDirPath,
  getDownloadedRuntimeFilePath,
  getGameLibrariesDirectoryPath,
} from "./LauncherGameAsset";
import path from "path";
import {
  fetchJavaRuntimeVersion,
  getCurrentJavaRuntimeVersion,
} from "./LauncherJavaRuntime";
import fs from "fs";
import decompress from "@xingrz/decompress";
import dTarGz from "@xingrz/decompress-targz";
import dUnzip from "@xingrz/decompress-unzip";
import {
  isLinux,
  isMacOS,
  isWindows,
} from "../platforms/environment/common/Environment";

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

export async function buildGameObject() {}

export class LibraryParser {
  public static isCompatibleOs(
    libraryOs: `osx` | `linux` | `windows` | string,
    version?: RegExp | string
  ): boolean {
    let _versionCondition = true;
    if (version) {
      // os.release().match(version)
      let regexTest = new RegExp(version);
      _versionCondition = regexTest.test(os.release());
    }
    // console.log(`-> `, isMacOS() && _versionCondition);
    switch (libraryOs) {
      case "osx": {
        return isMacOS() && _versionCondition;
      }
      case "linux": {
        return isLinux() && _versionCondition;
      }
      case "windows": {
        return isWindows() && _versionCondition;
      }
      default:
        throw new Error(`Unexpected library operating system ${libraryOs}`);
    }
  }

  public static getCompatibleLibraries(
    libraries: MinecraftVersionMetadataLibrary[]
  ): MinecraftVersionMetadataLibrary[] {
    return libraries.filter((lib) => {
      // Ignore when the rule is not found
      if (!lib.rules) {
        return true;
      }

      // If exists, go to next and check if allow on current os
      // console.log(lib.rules);
      let predicate = lib.rules.map((rule) => {
        let actionCond = rule.action == "allow" ? true : false;
        let osCond = !rule.os
          ? true
          : this.isCompatibleOs(rule.os.name, rule.os.version);
        // console.log(`-->`, actionCond && osCond);

        return actionCond && osCond;
      });
      // console.log(
      //   predicate,
      //   `->`,
      //   predicate.every((x) => x)
      // );

      return predicate.every((predicate) => predicate == true);
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
    // return this.getCompatibleLibraries(libraries)
    //   .map((artifact) => {
    //     return UrlDownloadReference.createFromPath(
    //       path.join(getGameLibrariesDirectoryPath(), artifact.path.toString()),
    //       artifact.url.toString(),
    //       artifact.size,
    //       new ReferenceChecksumSHA1(artifact.sha1)
    //     );
    //   })
    //   .filter((reference) => !fs.existsSync(reference.path));

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
