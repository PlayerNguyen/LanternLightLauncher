import {
  getLauncherAppData,
  getLauncherMetadata,
  isNetworkOnline,
  setNetworkOnline,
} from "./../../Launcher";
import path from "path";
import { expect } from "chai";
import {
  getVersionManifest,
  getVersionManifestFilePath,
  getVersionMetadata,
  getVersionMetadataFilePath,
} from "../../LauncherVersion";
import {
  buildGameFile,
  buildJavaRuntime,
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
  it(`getGameIndexesFromMetadata`, async () => {
    let latestRelease = (await getVersionManifest()).latest.release;
    expect(fs.existsSync(getVersionManifestFilePath())).true;

    let _metadata = await getVersionMetadata(latestRelease);
    expect(fs.existsSync(await getVersionMetadataFilePath(latestRelease))).true;

    let _gameIndexes = await getGameIndexesFromMetadata(_metadata);
    expect(_gameIndexes).to.have.property(`objects`);
  });
  it(`buildGameFile completely build`, async function () {
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

  it(`successfully build Java Runtime Environment - buildJavaRuntime`, async function () {
    this.timeout(0);

    let _latest = (await getVersionManifest()).latest.release;
    let _metadata = await getVersionMetadata(_latest);
    let _major = String(_metadata.javaVersion.majorVersion);
    // Execute build java runtime
    await buildJavaRuntime(_latest);

    // Check if download file is exist
    expect(fs.existsSync(getDownloadedRuntimeFilePath(_major))).to.be.true;
  });

  it(`launchMinecraft by using --launch`, async function () {
    this.timeout(0);
    if (!(argv as any).launch) {
      this.skip();
    } else {
      let latestRelease = (await getVersionManifest()).latest.release;
      expect(async () => {
        let _username = (argv as any).username;
        let _version = (argv as any).version;
        console.log(argv);

        // Launch the minecraft
        await launchMinecraft(
          _version ? _version : latestRelease,
          _username ? _username : "Player_Nguyen"
        );
      }).to.not.throw();
    }
  });

  it(`getLauncherLoggingDirectoryPath return launcher app data and launcher-logs`, () => {
    let sample = getLauncherLoggingDirectoryPath();
    expect(sample).to.includes(getLauncherAppData());
    expect(sample).to.includes(getLauncherMetadata().Path.LauncherLogs);
  });
});
