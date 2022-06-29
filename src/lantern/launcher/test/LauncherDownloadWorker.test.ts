
import { expect } from "chai";
import path from "path";
import fs from "fs";
import { getLauncherAppData } from "../Launcher";
import {
  DownloadWorker,
  ReferenceChecksum,
  UrlDownloadReference,
} from "./../LauncherDownloadWorker";

const createDownloadReference = (
  url: string,
  path: string,
  sum?: ReferenceChecksum
) => {
  return UrlDownloadReference.createFromPath(path, url, 0, sum);
};

describe("LauncherDownloadWorker", () => {
  
// <<<<<<< wip/build-game-files
  beforeEach(function () {});
  it(`should exist all resolved items which was downloaded`, async function () {
    this.timeout(0);
    DownloadWorker.getInstance().pushAll(
      createDownloadReference(
        "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
        path.join(getLauncherAppData(), "1.json")
      ),
      createDownloadReference(
        "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
        path.join(getLauncherAppData(), "2.json")
      )
    );

    let _items = await DownloadWorker.getInstance().downloadAllPendingItems();

    let _responses = _items.map((item) =>
      fs.existsSync(path.join(item.path, item.name))
    );
    expect(_responses.every((x) => x === true)).to.be.true;
// =======
//   afterEach(() => {
//     if (fs.existsSync(getLauncherAppData()))
//       fs.rmdirSync(getLauncherAppData(), { recursive: true });
//   });
//   it(`Download test with check sum`, async function () {
//     this.timeout(0);
//     expect(async function () {
//       for (let i = 0; i < 3; i++) {
//         LauncherDownLoadWorker.getLaunchPad().addReference(
//           new UrlDownloadReference(
//             `test${i}.json`,
//             getLauncherAppData(),
//             "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
//             new ReferenceChecksumSHA1(
//               "d45eb5e0c20e5d753468de3d68b05c45a946f49b"
//             )
//           )
//         );
//       }

//       await LauncherDownLoadWorker.getLaunchPad().launch({
//         onComplete: (reference) => {
//           expect(fs.existsSync(path.join(reference.path, reference.name))).to.be
//             .true;
//         },
//       });
//     }).not.to.throws();
//   });
//   it(`Download test without check sum `, async function () {
//     this.timeout(0);
//     expect(async function () {
//       for (let i = 0; i < 3; i++) {
//         LauncherDownLoadWorker.getLaunchPad().addReference(
//           new UrlDownloadReference(
//             `test${i}.json`,
//             getLauncherAppData(),
//             "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json"
//           )
//         );
//       }

//       await LauncherDownLoadWorker.getLaunchPad().launch({
//         onComplete: (reference) => {
//           expect(fs.existsSync(path.join(reference.path, reference.name))).to.be
//             .true;
//         },
//       });
//     }).not.to.throws();
//   });

//   it(`Could not download after failed the check sum hash`, async function () {
//     this.timeout(0);
//     LauncherDownLoadWorker.getLaunchPad().addReference(
//       new UrlDownloadReference(
//         `test.json`,
//         getLauncherAppData(),
//         "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
//         new ReferenceChecksumSHA1("") // Create empty hash,
//       )
//     );
//     try {
//       await LauncherDownLoadWorker.getLaunchPad().launch({
//         maxRetry: 1,
//         onComplete: (reference) => {
//           expect(fs.existsSync(path.join(reference.path, reference.name))).to.be
//             .true;
//         },
//       });
//     } catch (err) {
//       expect(err).to.instanceOf(Error);
//       expect((err as Error).message).to.equal("Failed to check sum");
//     }
//   });

//   it(`Failed when not found any network`, async function () {
//     this.timeout(0);
//     let _currentNetworkStatus = isNetworkOnline();

//     LauncherRuntimePersist.getRuntimePersist().setData({
//       network: "offline",
//     });

//     LauncherDownLoadWorker.getLaunchPad().addReference(
//       new UrlDownloadReference(
//         `test.json`,
//         getLauncherAppData(),
//         "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json"
//       )
//     );

//     // Launching the spaceship
//     try {
//       await LauncherDownLoadWorker.getLaunchPad().launch({});
//     } catch (err) {
//       expect(err).to.instanceOf(Error);
//       expect((err as Error).message).to.eq(
//         "No connection was established. Check your connection"
//       );
//     }

//     // Reset the current network status
//     LauncherRuntimePersist.getRuntimePersist().setData({
//       network: _currentNetworkStatus ? "online" : "offline",
//     });
// >>>>>>> master
  });
});
