import { getLauncherAppData, getLauncherMetadata } from "../Launcher";
import {
  LauncherDownLoadWorker,
  ReferenceChecksumSHA1,
  UrlDownloadReference,
} from "./../LauncherDownloadWorker";

describe("LauncherDownloadWorker", () => {
  it(`download test`, async () => {
    for (let i = 0; i < 1; i++) {
      // LauncherDownLoadWorker.getLaunchPad().addReference({
      //   name: `test${i}.txt`,
      //   path: getLauncherAppData(),
      //   url: getLauncherMetadata().API.Url.MinecraftVersionManifestUrl,
      // });
      LauncherDownLoadWorker.getLaunchPad().addReference(
        new UrlDownloadReference(
          `test${i}.json`,
          getLauncherAppData(),
          "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
          new ReferenceChecksumSHA1("d45eb5e0c20e5d753468de3d68b05c45a946f49b")
        )
      );
    }

    await LauncherDownLoadWorker.getLaunchPad().launch({
      onComplete: (reference) => {
        console.log(reference);
      },
    });
  });
});
