import {
  getLauncherAppData,
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
  getGameAssetDirectoryPath,
  getGameAssetIndexFilePath,
  getGameAssetObjectDirectoryPath,
  getGameIndexesFromMetadata,
} from "../LauncherGameAsset";

import fs from "fs";

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
    let _indexes = await getGameIndexesFromMetadata(_metadata);

    expect(_indexes.objects).to.be.instanceOf(Array);

    // Assume get the gameIndexes again, must return an array in objects
    let _indexes2 = await getGameIndexesFromMetadata(_metadata);
    expect(_indexes2.objects).to.be.instanceOf(Array);
  });
  it(`buildGameFile completely build`, async function () {
    this.timeout(0);
    let latestRelease = (await getVersionManifest()).latest.release;
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

      expect(
        _gameIndexes.objects
          .map((obj) => {
            let _path = path.join(
              getGameAssetObjectDirectoryPath(),
              obj.hash.substring(0, 2),
              obj.hash
            );
            // The line below to check predicates
            // console.log(fs.existsSync(_path), path.basename(_path));

            return fs.existsSync(_path);
          })
          .every((x) => x)
      ).to.be.true;
    }).to.not.throws();
  });
});
