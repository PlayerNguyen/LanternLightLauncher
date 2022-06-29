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
  });
});
