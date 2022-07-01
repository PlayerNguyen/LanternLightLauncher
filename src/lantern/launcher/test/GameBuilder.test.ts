import { expect } from "chai";
import { AxiosJsonLoader } from "./../../utils/request/AxiosHelper";
import { buildJavaRuntime } from "../GameBuilder";
import fs from "fs";
import { getDownloadedRuntimeFilePath } from "../LauncherGameAsset";
import { getCurrentJavaRuntimeVersion } from "../LauncherJavaRuntime";

describe("should build a game object indexes", () => {});

describe("GameBuilder - runtime builder", async () => {
  it(`should exist file in runtime or exist system jre version`, async function () {
    this.timeout(0);

    let releaseObject = await AxiosJsonLoader.get<{
      available_lts_releases: number[];
      available_releases: number[];
      most_recent_feature_release: number;
      most_recent_feature_version: number;
      most_recent_lts: number;
      tip_version: number;
    }>("https://api.adoptium.net/v3/info/available_releases");

    let shouldDownloadVersion = releaseObject.data.most_recent_lts;

    let systemVersion = getCurrentJavaRuntimeVersion();
    if (
      systemVersion &&
      systemVersion.major &&
      Number.parseInt(systemVersion.major) < shouldDownloadVersion
    ) {
      await buildJavaRuntime(shouldDownloadVersion);
      expect(fs.existsSync(getDownloadedRuntimeFilePath()));
    } else {
      expect(systemVersion).not.undefined;
    }
  });
});
