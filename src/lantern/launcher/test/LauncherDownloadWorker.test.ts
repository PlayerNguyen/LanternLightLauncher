import fs from "fs";
import path from "path";
import { expect } from "chai";
import {
  getAppData,
  getLauncherAppData,
  getLauncherMetadata,
} from "../Launcher";
import {
  LauncherDownLoadWorker,
  ReferenceChecksumSHA1,
  UrlDownloadReference,
} from "./../LauncherDownloadWorker";

describe("LauncherDownloadWorker", () => {
  afterEach(() => {
    fs.rmdirSync(getLauncherAppData(), { recursive: true });
  });
  it(`download test`, async function () {
    this.timeout(0);
    expect(async function () {
      for (let i = 0; i < 3; i++) {
        LauncherDownLoadWorker.getLaunchPad().addReference(
          new UrlDownloadReference(
            `test${i}.json`,
            getLauncherAppData(),
            "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
            new ReferenceChecksumSHA1(
              "d45eb5e0c20e5d753468de3d68b05c45a946f49b"
            )
          )
        );
      }

      await LauncherDownLoadWorker.getLaunchPad().launch({
        onComplete: (reference) => {
          expect(fs.existsSync(path.join(reference.path, reference.name))).to.be
            .true;
        },
      });
    }).not.to.throws();
  });
});
