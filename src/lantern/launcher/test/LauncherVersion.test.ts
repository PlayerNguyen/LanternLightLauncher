import {
  downloadManifestFile,
  getVersionMetadata,
  getVersionMetadataFilePath,
  MinecraftManifest,
} from "./../LauncherVersion";

import { expect } from "chai";
import {
  getVersionDirectoryPath,
  getVersionManifest,
  getVersionManifestFilePath,
  updateManifestFile,
} from "../LauncherVersion";
import fs from "fs";
import { LauncherRuntimePersist } from "../Launcher";

describe("LauncherVersion", () => {
  after(function () {
    // fs.rmSync(getVersionDirectoryPath(), { force: true, recursive: true });
  });

  it(`should download and exist a manifest file`, async () => {
    await downloadManifestFile();
    expect(fs.existsSync(getVersionManifestFilePath())).to.be.true;

    const _item = JSON.parse(
      fs.readFileSync(getVersionManifestFilePath(), "utf-8")
    ) as MinecraftManifest;

    let _stats = fs.statSync(getVersionManifestFilePath());

    expect(_item).to.have.property("latest").and.to.have.property(`release`);
    expect(_item).to.have.property("latest").and.to.have.property(`snapshot`);
    expect(Date.now() - _stats.mtime.getTime())
      .to.gt(-1)
      .and.lt(1000);
  });

  it("updateLauncherManifest without exist file", async function () {
    // More time to download
    this.timeout(10000);
    // Download the file
    await updateManifestFile();

    expect(fs.existsSync(getVersionDirectoryPath())).to.be.true;
    expect(fs.existsSync(getVersionManifestFilePath())).to.be.true;
    let _file = fs.readFileSync(getVersionManifestFilePath(), "utf-8");
    expect(_file).to.not.be.undefined;
    // let _dataFromFile = JSON.parse(_file);
  });

  it(`updateLauncherManifest with exist file`, async function () {
    this.timeout(10000);
    // Download the file
    await updateManifestFile();
    let _status = fs.statSync(getVersionManifestFilePath());

    // Re-download a file
    await updateManifestFile();
    let _status1 = fs.statSync(getVersionManifestFilePath());
    expect(_status.mtime.getTime()).to.equal(_status1.mtime.getTime());

    // let _dummyTime = Date.now() + 1000000000;
    // _status1.atime = new Date(_dummyTime);
    // // Update

    // // let _status2 = fs.statSync(getVersionManifestFilePath());
    // expect(_status2.mtime.getTime()).to.equal(Date.now());
  });

  it(`getVersionManifest`, async function () {
    LauncherRuntimePersist.getRuntimePersist().setData({ network: "online" });
    let _versionManifest = await getVersionManifest();
    expect(_versionManifest).to.instanceOf(Object);
    expect(_versionManifest).to.have.property("latest");
    expect(_versionManifest).to.have.property("versions");
  });

  it(`getVersionMetadata`, async function () {
    this.timeout(10000);
    let _manifest = await getVersionManifest();
    expect(_manifest).not.to.be.undefined;
    expect(_manifest.latest).not.to.be.undefined;
    expect(fs.existsSync(getVersionManifestFilePath())).to.true;

    // Get the latest version id from _manifest
    let _latestVersionId = _manifest.latest.release;
    let _latestVersionMetadata = await getVersionMetadata(_latestVersionId);

    // Expect the file is downloaded
    expect(fs.existsSync(await getVersionMetadataFilePath(_latestVersionId))).to
      .be.true;

    expect(_latestVersionMetadata).to.have.property("arguments");
  });
});
