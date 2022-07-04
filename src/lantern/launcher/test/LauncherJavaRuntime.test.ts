import querystring from "query-string";
import { expect } from "chai";
import { getLauncherMetadata } from "../Launcher";
import {
  buildAssetReleaseAdoptiumUrl,
  fetchJavaRuntimeVersion,
  hasJavaRuntime,
  JavaRuntimeVersion,
} from "../LauncherJavaRuntime";

describe("LauncherJavaRuntime", () => {
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
  it(`test java runtime version class (sematic)`, async () => {
    let _version = new JavaRuntimeVersion("17.0.4");
    expect(_version.major).to.equal("17");
    expect(_version.minor).to.eq("0");
    expect(_version.patch).to.equal("4");
  });
});
