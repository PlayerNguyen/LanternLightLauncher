import querystring from "query-string";
import { expect } from "chai";
import { getLauncherMetadata } from "../../Launcher";
import {
  buildAssetReleaseAdoptiumUrl,
  fetchJavaRuntimeVersion,
  hasJavaRuntime,
} from "../LauncherJavaRuntime";

describe("LauncherJavaRuntime", () => {
  let _sample = [
    {
      version: "7",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/7/ga`,
    },
    {
      version: "8",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/8/ga`,
    },
    {
      version: "9",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/9/ga`,
    },
    {
      version: "10",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/10/ga`,
    },
    {
      version: "11",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/11/ga`,
    },
    {
      version: "14",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/14/ga`,
    },
    {
      version: "15",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/15/ga`,
    },
    {
      version: "17",
      expectation: `${
        getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
      }/assets/feature_releases/17/ga`,
    },
  ];
  let _query = querystring.stringify({
    image_type: "jre",
    architecture: "x64",
  });
  it(`Build a Adoptium url`, () => {
    _sample.forEach((_item) => {
      expect(
        buildAssetReleaseAdoptiumUrl(Number.parseInt(_item.version))
      ).to.equal(_item.expectation + "?" + _query);
    });
  });

  it(`fetchJavaRuntime response`, function (done) {
    this.timeout(0);
    fetchJavaRuntimeVersion(8).then((response) => {
      expect(response.data).not.to.be.undefined;
      // TODO: test response data content
      done();
    });
  });

  it(`hasJavaRuntime: response test`, () => {
    /**
     * TODO: hasJavaRuntime test implementation
     */
  });

  it(`getCurrentJavaRuntimeVersion: response JRE version or null`, () => {
    /**
     * TODO: getCurrentJavaRuntimeVersion test implementation
     */
  });
});
