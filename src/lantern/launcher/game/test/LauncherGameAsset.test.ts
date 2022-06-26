import fs from "fs";

import { getGameAssetDirectoryPath } from "../LauncherGameAsset";

describe("LauncherGameAsset", () => {
  beforeEach(function () {
    this.slow();
  });
  afterEach(async () => {
    // Clean up after every test stage
    if (fs.existsSync(await getGameAssetDirectoryPath())) {
      fs.rmSync(await getGameAssetDirectoryPath());
    }
  });
  it(`buildGameFile completely build`, async function () {
    
  });
});
