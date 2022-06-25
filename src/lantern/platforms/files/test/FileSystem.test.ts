import { DiskFileSystemProvider } from "../common/DiskFileSystem";
import { expect } from "chai";
import path from "path";
import fs from "fs";

describe(`File System `, () => {
  it(`Disk File System - functionally test`, () => {
    // let _target = path.join(__dirname, `dummy.file`);
    let _filename = "dummy.file";
    let provider = new DiskFileSystemProvider(_filename, __dirname);
    expect(provider.exist()).to.be.false;
    expect(provider.getPath()).to.be.string(path.join(__dirname, _filename));

    expect(provider.name).to.equal("dummy.file");
    expect(provider.root).to.equal(__dirname);
  });

  describe("Disk File System: Write - write a test file", () => {
    let _name = "dummy.txt";
    let _path = path.join(__dirname, "dist");
    let provider = new DiskFileSystemProvider(_name, path.join(_path));

    afterEach(() => {
      if (fs.existsSync(path.join(_path, _name)))
        fs.unlinkSync(path.join(_path, _name));

      if (fs.existsSync(_path)) fs.rmdirSync(_path);
    });

    it(`Write on empty file without path`, () => {
      expect(() => {
        provider.writeFile("hello, tester");
      }).not.to.throw();
      expect(fs.readFileSync(path.join(_path, _name)).toString()).to.equal(
        "hello, tester"
      );
    });
  });

  describe("Disk File System: Read - read a test file", () => {
    let parent = __dirname;
    let name = "sample.txt";
    let _path = path.join(parent, name);

    let sample = new DiskFileSystemProvider(name, parent);
    beforeEach(() => {
      sample.writeFile(`Hello`);
    });
    afterEach(() => {
      if (fs.existsSync(_path)) {
        fs.unlinkSync(_path);
      }
    });

    it(`Read sample file without throwing any exception`, () => {
      expect(() => {
        let _ = sample.readFile({ encoding: "utf8" });

        expect(_).to.be.a.string;
        expect(_).to.eq("Hello");
      }).not.to.throw();
    });

    it(`Returns Buffer`, () => {
      expect(typeof sample.readFile()).to.not.undefined;
    });
  });
});
