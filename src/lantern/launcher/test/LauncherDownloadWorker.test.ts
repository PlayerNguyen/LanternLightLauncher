import chalk from "chalk";
import { expect } from "chai";
import path from "path";
import fs from "fs";
import { getLauncherAppData } from "../Launcher";
import {
  DownloadWorker,
  getDownloadWorker,
  printDownloadWorker,
  ReferenceProgress,
  UrlDownloadReference,
} from "../LauncherDownloadWorker";

// const createRef = (url: string, path: string, sum?: ReferenceChecksum) => {
//   return UrlDownloadReference.createFromPath(path, url, 0, sum);
// };

describe("LauncherDownloadWorker", () => {
  // <<<<<<< wip/build-game-files
  beforeEach(function () {});
  // it(`should exist all resolved items which was downloaded`, async function () {
  //   this.timeout(0);
  //   DownloadWorker.getInstance().pushAll([
  //     createRef(
  //       "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
  //       path.join(getLauncherAppData(), `download-tests`, "1.json")
  //     ),
  //     createRef(
  //       "https://piston-meta.mojang.com/v1/packages/d45eb5e0c20e5d753468de3d68b05c45a946f49b/1.19.json",
  //       path.join(getLauncherAppData(), `download-tests`, "2.json")
  //     ),
  //   ]);

  //   let _items = await DownloadWorker.getInstance().downloadAllPendingItems({
  //     onData(ref, data) {
  //       expect(ref).not.to.be.undefined;
  //       expect(data).not.to.be.undefined;
  //     },
  //   });

  //   let _responses = _items.map((item) =>
  //     fs.existsSync(path.join(item.path, item.name))
  //   );
  //   expect(_responses.every((x) => x === true)).to.be.true;

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
  // });

  it(`download worker reject test`, async function () {
    try {
      await getDownloadWorker().download(
        UrlDownloadReference.createFromPath(
          path.join(getLauncherAppData(), `downloads.txt`),
          "https://aaa",
          0
        )
      );
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
    }

    // fs.rmSync(path.join(getLauncherAppData(), `downloads.txt`));
  });

  it(`should create a recursive directory when it is not exists`, async function () {
    this.timeout(10000);

    try {
      await getDownloadWorker().download(
        UrlDownloadReference.createFromPath(
          path.join(getLauncherAppData(), `download-tests`, `downloads.txt`),
          "https://google.com",
          0
        )
      );

      // Must be true
      expect(fs.existsSync(path.join(getLauncherAppData(), `download-tests`)))
        .to.be.true;
    } catch (err) {
      expect(err).not.to.be.instanceOf(Error);
    }

    // Then clean this up
    fs.rmSync(path.join(getLauncherAppData(), `download-tests`), {
      recursive: true,
      force: true,
    });
  });

  it(`should remove if the ref is exists in worker`, async () => {
    let _ref = UrlDownloadReference.createFromPath(
      path.join(getLauncherAppData(), `download-tests`, `downloads.txt`),
      "https://google.com",
      0
    );
    await getDownloadWorker().push(_ref).download(_ref);

    expect(
      fs.existsSync(
        path.join(getLauncherAppData(), `download-tests`, `downloads.txt`)
      )
    ).to.be.true;
    // Then clean this up
    fs.rmSync(path.join(getLauncherAppData(), `download-tests`), {
      recursive: true,
      force: true,
    });
  });

  it(`Url Reference color generator for low-level`, async function () {
    // Take the current chalk level and simulate the low-level
    let tempLevel = chalk.level;
    chalk.level = 1;

    let arr: UrlDownloadReference[] = [];
    arr = [
      ...arr,
      ...Array(100).fill(
        UrlDownloadReference.createFromPath(getLauncherAppData(), `url`)
      ),
    ];

    // Expect every elements in arr must not be undefined
    expect(arr.every((x) => x.color !== undefined)).to.be.true;

    // Reset to current chalk level
    chalk.level = tempLevel;
  });

  // it(`sha256 reference checksum test`, () => {
  //   let _sample = [
  //     {
  //       data: "kkk",
  //       hash: "96EFBC43A462AB9D9C6A8173E5B322E17F218B56EB3A05A4BBC53221ADEBC7B3",
  //     },
  //     {
  //       data: "iNAudsoix)O!++",
  //       hash: "6ADA95EC53EF41002A86EED7374A9CF35271FAAB6C426791C2DFDA7703120357",
  //     },
  //   ];
  //   expect(
  //     _sample
  //       .map(({ data, hash }) => {
  //         let _response = new ReferenceChecksumSHA256(
  //           hash.toLowerCase()
  //         ).checksum(data);

  //         return _response;
  //       })
  //       .every((x) => x)
  //   ).true;
  // });

  // it(`sha1 reference checksum test`, () => {
  //   let _sample = [
  //     {
  //       data: "0UASDUHxcgoaso~)(ES(DAJXCJAU HWIcankjcja",
  //       hash: "d31db0c7919580b764ecfaf939ab843a7dbda93c",
  //     },
  //     {
  //       data: "9iIU!@Y&xzokvOIUW POSA JC.SA>C>ASDKOAKCSUACSGSADAS<<>AS)DASKOAXCJIW",
  //       hash: "3fe0359b8fb3eaea29f4f9dfc2dfef3e9eed16b0",
  //     },
  //   ];
  //   expect(
  //     _sample
  //       .map(({ data, hash }) => {
  //         let _response = new ReferenceChecksumSHA1(
  //           hash.toLowerCase()
  //         ).checksum(data);

  //         return _response;
  //       })
  //       .every((x) => x)
  //   ).true;
  // });

  it(`print download worker test`, () => {
    expect(() => {
      printDownloadWorker(`abc`);
      let a = { k: " c" };
      printDownloadWorker(a);
    }).not.to.throws();
  });

  it(`reference progress constructor logic test`, () => {
    expect(new ReferenceProgress().length).to.equal(0);
    let _number = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
    expect(new ReferenceProgress(_number).length).to.equal(_number);
  });
});
