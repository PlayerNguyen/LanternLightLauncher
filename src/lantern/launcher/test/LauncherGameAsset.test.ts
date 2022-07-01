import { LibraryParser } from "../GameBuilder";

import {
  getLauncherAppData,
  getLauncherMetadata,
  isNetworkOnline,
  setNetworkOnline,
} from "../Launcher";
import path from "path";
import { expect } from "chai";
import {
  getVersionManifest,
  getVersionManifestFilePath,
  getVersionMetadata,
  getVersionMetadataFilePath,
} from "../LauncherVersion";
import {
  buildGameFile,
  // buildJavaRuntime,
  getDownloadedRuntimeFilePath,
  getGameAssetDirectoryPath,
  getGameAssetIndexFilePath,
  getGameAssetObjectDirectoryPath,
  getGameIndexesFromMetadata,
  getLauncherLoggingDirectoryPath,
  launchMinecraft,
} from "../LauncherGameAsset";

import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  isLinux,
  isMacOS,
  isWindows,
} from "../../platforms/environment/common/Environment";

let argv = yargs(hideBin(process.argv)).argv;

describe("LauncherGameAsset", () => {
  let _network = isNetworkOnline();
  beforeEach(function () {
    this.slow();

    // Hook up a network
    setNetworkOnline(true);
  });
  after(async () => {
    setNetworkOnline(_network);
  });

  it(`getGameAssetIndexFilePath returns true path`, async () => {
    expect(await getGameAssetIndexFilePath("k")).eq(
      path.join(getLauncherAppData(), `assets`, `indexes`, `k.json`)
    );
  });

  it(`getGameAssetDirectoryPath returns true path`, async () => {
    expect(await getGameAssetDirectoryPath()).eq(
      path.join(getLauncherAppData(), `assets`)
    );
  });

  it(`getGameIndexesFromMetadata`, async function () {
    try {
      let latestRelease = (await getVersionManifest()).latest.release;
      expect(fs.existsSync(getVersionManifestFilePath())).true;

      let _metadata = await getVersionMetadata(latestRelease);
      expect(fs.existsSync(await getVersionMetadataFilePath(latestRelease)))
        .true;

      let _gameIndexes = await getGameIndexesFromMetadata(_metadata);
      expect(_gameIndexes).to.have.property(`objects`);
    } catch (err) {
      throw err;
    }
  });

  it(`buildGameFile completely build`, async function () {
    this.skip(); // todo: enable again after finish
    this.timeout(0);
    let latestRelease = (await getVersionManifest()).latest.release;

    // let latestRelease = "1.12.2";
    expect(async () => {
      await buildGameFile(latestRelease);

      // Must download a file
      expect(fs.existsSync(getGameAssetObjectDirectoryPath())).to.true;

      // Get from version
      let _assetIndexFilePath = await getGameAssetIndexFilePath(latestRelease);
      expect(fs.existsSync(_assetIndexFilePath)).to.true;

      let _gameIndexes = await getGameIndexesFromMetadata(
        await getVersionMetadata(latestRelease)
      );

      let _indexContainer = [];
      for (let item in _gameIndexes.objects) {
        let { hash, size }: { hash: string; size: number } =
          _gameIndexes.objects[item];
        _indexContainer.push({
          hash,
          size,
          path: path.join(
            getGameAssetObjectDirectoryPath(),
            hash.substring(0, 2),
            hash
          ),
        });
      }

      // Check that all files must be true
      expect(
        _indexContainer
          .map((_index) => fs.existsSync(_index.path))
          .every((x) => x)
      ).to.be.true;
    }).not.throws();
  });

  it(`launchMinecraft by using --launch`, async function () {
    this.timeout(0);
    if (!(argv as any).launch) {
      this.skip();
    } else {
      let latestRelease = (await getVersionManifest()).latest.release;
      try {
        let _username = (argv as any).username;
        let _version = (argv as any).version;
        console.log(argv);

        // Launch the minecraft
        await launchMinecraft("1.18", _username ? _username : "Player_Nguyen");
      } catch (err) {
        if (err) {
          throw err;
        }
        expect(err).not.to.instanceOf(Error);
      }
    }
  });

  it(`getLauncherLoggingDirectoryPath return launcher app data and launcher-logs`, () => {
    let sample = getLauncherLoggingDirectoryPath();
    expect(sample).to.includes(getLauncherAppData());
    expect(sample).to.includes(getLauncherMetadata().Path.LauncherLogs);
  });

  describe(`getIndexesFromMetadata`, () => {
    it(`Get all indexes resource from manifest (resolve all)`, async function () {
      this.skip();
      this.timeout(0);

      try {
        // Get all available version list
        let availableVersionList = (await getVersionManifest()).versions.map(
          (manifestVersion) => manifestVersion.id
        );

        // Get indexes from all available versions
        let metadataList = await Promise.all(
          availableVersionList.map(async (_) => {
            return await getVersionMetadata(_);
          })
        );

        // Get all indexes objects
        let indexesAssetList = await Promise.all(
          metadataList.map(async (x) => await getGameIndexesFromMetadata(x))
        );

        // All must have an objects
        expect(indexesAssetList.every((x) => x.objects)).true;

        // All must exist file
        expect(
          metadataList.every((metadata) =>
            fs.existsSync(getGameAssetIndexFilePath(metadata.assetIndex.id))
          )
        ).to.true;

        // Remove file to test non-exist of 10 items
        let removeMetadataList = metadataList.slice(0, 10);
        removeMetadataList.forEach((metadata) => {
          fs.rmSync(getGameAssetIndexFilePath(metadata.assetIndex.id), {
            force: true,
          });
        });

        // Then, retrieve the game index asset file again
        let retrieveAssetIndexList = await Promise.all(
          removeMetadataList.map(
            async (x) => await getGameIndexesFromMetadata(x)
          )
        );

        // All must have an objects
        expect(retrieveAssetIndexList.every((x) => x.objects)).true;

        // All must exist file
        expect(
          removeMetadataList.every((metadata) =>
            fs.existsSync(getGameAssetIndexFilePath(metadata.assetIndex.id))
          )
        ).to.true;
      } catch (e) {
        throw e;
      }
    });
  });

  describe(`buildGameLibraries`, () => {
    // it(`Validates regular metadata libraries`, async () => {
    //   // Remove if the latest file is exists
    //   let versions = (await getVersionManifest()).versions.map(
    //     (version) => version.id
    //   );
    //   let listOfMetadata = await Promise.all(
    //     versions.map(async (version) => await getVersionMetadata(version))
    //   );
    //   // All metadata have libraries and must be an array
    //   expect(
    //     listOfMetadata
    //       .map((metadata) => metadata.libraries)
    //       .every((exist) => exist)
    //   ).true;
    //   expect(
    //     listOfMetadata
    //       .map((metadata) => metadata.libraries)
    //       .every((exist) => exist instanceof Array)
    //   ).true;
    //   // Every library has downloads section
    //   expect(
    //     listOfMetadata
    //       .map((metadata) => {
    //         return metadata.libraries.every((libExist) => libExist.downloads);
    //       })
    //       .every((x) => x)
    //   ).true;
    //   listOfMetadata.map((metadata) => {
    //     metadata.libraries
    //       .filter((lib) => !lib.downloads.classifiers)
    //       .forEach((e) => {
    //         // console.log(metadata.id);
    //         // console.log(e);
    //       });
    //     return metadata.libraries.every((x) => x.downloads.artifact);
    //   });
    //   expect(
    //     listOfMetadata
    //       .map((metadata) => {
    //         return metadata.libraries.every((x) => x.downloads.artifact);
    //       })
    //       .every((x) => x)
    //   ).true;
    // });
    // TODO: fix this
  });

  describe("LibraryParser", () => {
    it(`Compatible operating system test`, () => {
      let testCases = [
        { os: `osx`, expectation: isMacOS() },
        { os: `linux`, expectation: isLinux() },
        { os: `windows`, expectation: isWindows() },
      ];

      testCases.forEach((test) =>
        expect(LibraryParser.isCompatibleOs(test.os)).eq(test.expectation)
      );

      // Fail case throw exception
      expect(() => {
        LibraryParser.isCompatibleOs(`sunos`);
      }).to.throws(/Unexpected library/);
    });
  });
});
