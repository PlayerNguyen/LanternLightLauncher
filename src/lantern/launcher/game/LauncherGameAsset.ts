import chalk from "chalk";
import {
  getDownloadWorker,
  ReferenceChecksumSHA1,
  ReferenceChecksumSHA256,
  UrlDownloadReference,
} from "./../LauncherDownloadWorker";
import {
  getVersionDirectoryPath,
  getVersionMetadata,
  MinecraftVersionMetadata,
  RuleOperatingSystem,
} from "./../LauncherVersion";
import { getVersionManifest } from "../LauncherVersion";
import path from "path";
import fs from "fs";
import { getLauncherAppData, getLauncherMetadata } from "../Launcher";
import {
  isLinux,
  isMacOS,
  isWindows,
} from "../../platforms/environment/common/Environment";
import child from "child_process";
import { version } from "yargs";
import {
  buildAssetReleaseAdoptiumUrl,
  fetchJavaRuntimeVersion,
  getCurrentJavaRuntimeVersion,
  hasJavaRuntime,
} from "../jre/LauncherJavaRuntime";
import zlib from "zlib";
import decompress from "@xingrz/decompress";
import dTarGz from "@xingrz/decompress-targz";
import dUnzip from "@xingrz/decompress-unzip";

export async function launchMinecraft(version: string, username: string) {
  // Build a game arguments
  let metadata = await getVersionMetadata(version);
  // Build the game file
  await buildGameFile(version);

  // let _buildArguments = metadata.arguments.jvm
  //   .map((jvm) => {
  //     if (typeof jvm === "string") {
  //       return jvm
  //         .replace(
  //           "${natives_directory}",
  //           `"${getGameLibrariesDirectoryPath()}"`
  //         )
  //         .replace("${launcher_name}", "LanternLightLauncher") // TODO: cut it as a constant or configuration
  //         .replace("${launcher_version}", "1.0.0") // TODO: the same as the line above
  //         .replace(
  //           "${classpath}",
  //           path.join(
  //             getVersionFromIdDirectoryPath(version),
  //             version.concat(".jar")
  //           )
  //         );
  //     } else {
  //       return ""; // todo: handle this object, separate this into small pieces
  //     }
  //   })
  //   .concat(
  //     metadata.arguments.game.map((argument) => {
  //       if (typeof argument === "string") {
  //         return argument
  //           .replace("${auth_player_name}", username)
  //           .replace("${version_name}", version)
  //           .replace("${game_directory}", `"${getLauncherAppData()}"`)
  //           .replace("${assets_root}", `"${getGameAssetDirectoryPath()}"`)
  //           .replace("${assets_index_name}", metadata.assetIndex.id);
  //       } else {
  //         return "";
  //       }
  //     })
  //   );

  let _classPath = metadata.libraries
    .filter((library) => {
      if (library.rules) {
        return (
          isValidOS(library.rules[0].os) && library.rules[0].action === "allow"
        );
      }
      return true;
    })
    .map((lib) => {
      // parse as follow <packages> :  <name> : <version>
      // console.log(lib);

      let [packages, name, version] = lib.name.split(":");
      // console.log(packages, name, version);

      return path.join(
        getGameLibrariesDirectoryPath(),
        packages.split(".").join(path.sep),
        name,
        version,
        path.basename(lib.downloads.artifact.path.toString())
      );
    })
    .concat([
      path.join(getVersionFromIdDirectoryPath(version), version.concat(".jar")),
    ]);

  let launchArgs = [
    `-XstartOnFirstThread`,
    // `-Dlog4j.configurationFile=${path.join(
    //   getAssetLogConfigsDirectoryPath(),
    //   path.basename(metadata.logging.client.file.url.toString())
    // )}`,
    `-Djava.library.path="${path.join(
      getVersionFromIdDirectoryPath(version),
      `natives`
    )}"`,
    "-Dminecraft.launcher.brand=LanternLightLancher",
    "-Dminecraft.launcher.version=1.0.0",

    "-cp",
    `${_classPath.join(path.delimiter)}`,
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
    `183c0bf5-3723-389c-9b9f-dbc218d6d783`,

    `--clientId`,
    ``,

    `--xuid`,
    `null`,
  ];
  // console.log(launchArgs);

  try {
    // let process = child.spawnSync(`java`, [..._buildArguments]);
    let process = child.spawn(
      path.join(
        getDownloadedRuntimeJavaHome(String(metadata.javaVersion.majorVersion)),
        `java`
      ),
      launchArgs
    );

    // console.log(process.stderr && process.stderr.toString());
    // console.log(process.stdout && process.stdout.toString());

    fs.mkdirSync(getLauncherLoggingDirectoryPath(), {
      recursive: true,
    });

    fs.createWriteStream(
      path.join(getLauncherLoggingDirectoryPath(), "latest.txt")
    ).write(process.stdout);

    // console.log(`Process status: ${process.status}`);
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

  // Build Java Runtime
  // await buildJavaRuntime(version);

  // Build a game asset index
  await buildGameAsset(version);

  // Build game library
  await buildGameLibraries(version);

  // Build log configs
  await buildLogConfig(version);

  // Build game class
  await buildGameClass(version);
}

export async function buildJavaRuntime(version: string) {
  let metadata = await getVersionMetadata(version);

  // Check if the user has runtime
  if (hasJavaRuntime()) {
    // Check if user runtime is compatible with requirements
    let _version = getCurrentJavaRuntimeVersion();
    let _requireMajorVersion = metadata.javaVersion.majorVersion;
    if (
      _version &&
      _version.major &&
      parseInt(_version.major) < _requireMajorVersion
    ) {
      console.log(
        `Require to download a new runtime, downloading version ${chalk.yellow.bold(
          _requireMajorVersion
        )}`
      );

      // Check if has downloaded runtime before
      if (
        !fs.existsSync(
          getDownloadedRuntimeFilePath(String(_requireMajorVersion))
        )
      ) {
        // Start downloading the latest release openjdk JRE flash
        let _responseJson = (
          await fetchJavaRuntimeVersion(_requireMajorVersion)
        ).data;

        let _latestPackageObject = _responseJson[0].binaries[0].package;
        console.log(_latestPackageObject);

        let _dest = path.join(
          getDownloadedRuntimeDirPath(String(_requireMajorVersion)),
          _latestPackageObject.name
        );

        if (!fs.existsSync(_dest)) {
          await getDownloadWorker()
            .push(
              UrlDownloadReference.createFromPath(
                _dest,
                _latestPackageObject.link,
                _latestPackageObject.size,
                new ReferenceChecksumSHA256(_latestPackageObject.checksum)
              )
            )
            .downloadAllPendingItems();
        }

        // Then extract the downloaded file after finished
        // Depends on the os, if windows or linux we put it into ${LauncherAppData}/runtime/${version}/runtime/...
        // If it is a osx, put it into ${LauncherAppData}/runtime/${version}/runtime.bundle
        let _output = getDownloadedRuntimeDirPath(String(_requireMajorVersion));

        if (_latestPackageObject.name.includes(".tar.gz")) {
          await decompress(_dest, _output, {
            plugins: [dTarGz()],
          });
        } else {
          await decompress(_dest, _output, {
            plugins: [dUnzip()],
          });
        }

        // Convert the name file into a default file
        let _extractUnsanitizedFile = path.join(
          _output,
          fs.readdirSync(_output).filter((name) => name.includes("jdk-"))[0]
        );

        fs.renameSync(
          _extractUnsanitizedFile,
          getDownloadedRuntimeFilePath(String(_requireMajorVersion))
        );
      }
    }
  }
}

export function getDownloadedRuntimeDirPath(major: string) {
  return path.join(
    getLauncherAppData(),
    getLauncherMetadata().Path.Runtime,
    major
  );
}

export function getDownloadedRuntimeJavaHome(major: string) {
  return path.join(
    getDownloadedRuntimeFilePath(major),
    isMacOS() ? path.join(`Contents`, `Home`, `bin`) : path.join(`bin`)
  );
}

export function getDownloadedRuntimeFilePath(major: string) {
  // return path.join(getDownloadedRuntimeDirPath(major), `runtime.bundle`);
  // (isMacOS() ? path.join(path.dirname(_dest), `runtime.bundle`):)
  return path.join(
    getDownloadedRuntimeDirPath(major),
    isMacOS() ? `runtime.bundle` : `runtime`
  );
}

export async function buildGameClass(version: string) {
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
        new ReferenceChecksumSHA1(sha1)
      )
    );

    await getDownloadWorker().downloadAllPendingItems();
  }
}

export function getVersionFromIdDirectoryPath(version: string) {
  return path.join(getVersionDirectoryPath(), version);
}

export async function buildLogConfig(version: string) {
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
        new ReferenceChecksumSHA1(file.sha1)
      )
    );

    // Start to download
    getDownloadWorker().downloadAllPendingItems();
  }
}

async function buildGameAsset(version: string) {
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
        new ReferenceChecksumSHA1(asset.hash)
      )
    );
  });

  let _ = await getDownloadWorker().downloadAllPendingItems();
  if (_.length > 0) {
    console.log(chalk.green(`Successfully download ${_.length} items`));
  } else {
    console.log(chalk.green(`The asset objects already up-to-date`));
  }
}

export async function buildGameLibraries(version: string) {
  let metadata = await getVersionMetadata(version);
  // console.log(metadata);

  // Build and download a environment for operation system
  metadata.libraries
    .filter((library) => {
      let { path: _path } = library.downloads.artifact;

      let _actualPath = path.join(
        getGameLibrariesDirectoryPath(),
        _path.toString()
      );
      if (library.rules && library.rules[0]) {
        let rules = library.rules[0];
        // Check for operation system
        return (
          isValidOS(rules.os) &&
          rules.action === "allow" &&
          !fs.existsSync(_actualPath)
        );
      }

      // Return if the file is not exist
      return !fs.existsSync(_actualPath);
    })
    .map((_object) => {
      let { path: _path, url, size, sha1 } = _object.downloads.artifact;

      let _actualPath = path.join(
        getGameLibrariesDirectoryPath(),
        _path.toString()
      );

      return UrlDownloadReference.createFromPath(
        _actualPath,
        url.toString(),
        size,
        new ReferenceChecksumSHA1(sha1)
      );
    })
    .forEach((ref) => {
      getDownloadWorker().push(ref);
    });

  // console.log(_shouldDownloadLibraries);
  let response = await getDownloadWorker().downloadAllPendingItems();
  if (response.length > 0) {
    console.log(
      chalk.green(`Successfully download ${response.length} libraries`)
    );
  } else console.log(chalk.green(`The game libraries are up-to-date`));
}

function isValidOS(ruleOS: RuleOperatingSystem) {
  switch (ruleOS.name) {
    case "linux": {
      return isLinux();
    }
    case "osx": {
      return isMacOS();
    }
    case "windows": {
      return isWindows();
    }
    default:
      throw new Error(`Unsupported operating system ${ruleOS.name}`);
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
) {
  let _assetIndexRef = metadata.assetIndex;
  let _filePath = await getGameAssetIndexFilePath(_assetIndexRef.id);

  // Check if the indexes is available or not
  if (!fs.existsSync(_filePath)) {
    // Download the game indexes from Mojang API server into launcher data folder
    let _downloadReference = UrlDownloadReference.createFromPath(
      _filePath,
      _assetIndexRef.url.toString(),
      _assetIndexRef.size,
      new ReferenceChecksumSHA1(_assetIndexRef.sha1)
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
