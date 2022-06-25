import { platform } from "process";
import {
  Launcher,
  LauncherRuntimeConfigurationDefault,
  LauncherRuntimePersist,
} from "./../Launcher";
import { expect } from "chai";
import path from "path";
import fs from "fs";
import os from "os";

import {
  getAppData,
  getLauncherAppData,
  getLauncherMetadata,
} from "../Launcher";

console.log(`[Launcher.test.ts] Node Environment: ${process.env.NODE_ENV}`);
console.log(`[Launcher.test.ts] UserInfo`, os.userInfo().username);

const platforms = [
  {
    name: "darwin",
    expectation: path.sep + path.join(`Library`, `Application Support`),
  },
  { name: "win32", expectation: process.env.APPDATA || "window32:\\test" },
  {
    name: "linux",
    expectation: path.sep + path.join(`.local`, `share`),
  },
];

describe("Launcher", () => {
  it(`AppData - must a string and include pathname`, () => {
    let platform = process.platform;

    expect(getAppData()).itself.include(
      platform === "darwin"
        ? "Application Support"
        : platform === "win32"
        ? "Roaming"
        : "share"
    );
  });
  describe(`AppData - Platforms`, () => {
    // platforms.forEach((element) => {
    //   it(`${element.name}`, () => {
    //     let _original = Object.getOwnPropertyDescriptor(process, "platform");
    //     Object.defineProperty(process, "platform", { value: element.name });
    //     expect(getAppData()).to.eq(element.expectation);
    //     Object.defineProperty(
    //       process,
    //       "platform",
    //       _original as PropertyDescriptor
    //     );
    //   });
    // });
    // it(`unsupported platform`, () => {
    //   let _original = Object.getOwnPropertyDescriptor(process, "platform");
    //   Object.defineProperty(process, "platform", { value: "undefined" });
    //   expect(() => {
    //     getAppData();
    //   }).to.throw("Unsupported platform");
    //   Object.defineProperty(
    //     process,
    //     "platform",
    //     _original as PropertyDescriptor
    //   );
    // });
    platforms.forEach(function (element) {
      it(`${element.name} test`, function () {
        if (platform !== element.name) {
          this.skip();
          return;
        }

        expect(getAppData()).to.include(element.expectation);
        expect(fs.existsSync(getAppData())).true;
      });
    });
  });

  describe(`AppData - launcher app data`, () => {
    it(`non-testing environment response`, () => {
      let _old = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      expect(getLauncherAppData()).to.be.a.string;
      expect(getLauncherAppData()).to.eq(
        path.join(getAppData(), getLauncherMetadata().ShortName)
      );
      process.env.NODE_ENV = _old;
    });
    it(`testing environment response`, () => {
      let _old = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      expect(getLauncherAppData()).to.be.a.string;
      expect(getLauncherAppData()).to.eq(
        path.join(getAppData(), getLauncherMetadata().ShortName + "_Testing")
      );
      process.env.NODE_ENV = _old;
    });
  });

  describe(`Load the app launcher`, () => {
    let _launcherAppData = getLauncherAppData();

    function cleanUpLauncher() {
      fs.rmSync(_launcherAppData, { recursive: true, force: true });
    }

    beforeEach(() => {
      cleanUpLauncher();
    });
    afterEach(() => {
      // Clean up the Lantern directory
      cleanUpLauncher();
    });

    it(`Initialize: launcher should successfully init`, () => {
      expect(() => {
        let _launcher = new Launcher();

        // Create a directory
        expect(fs.existsSync(_launcherAppData)).to.be.true;
        // Launcher instance must not be null
        expect(_launcher).not.to.be.null;
        // Save without error
        _launcher.getConfigProvider().save();
      }).not.throw();
    });

    it(`Singleton setup successfully`, () => {
      expect(Launcher.getInstance()).not.to.be.undefined;
      expect(() => {
        Launcher.getInstance();
      }).not.to.throw();
    });

    it(`Initialize: load default for the configuration file`, () => {
      let _launcher = new Launcher();
      expect(_launcher.getConfigProvider()).not.to.be.undefined;
      expect(_launcher.getConfigProvider().exist()).to.be.true;
    });

    it(`Initialize: double-load when the file was created`, () => {
      expect(() => {
        let _launcher = new Launcher();
        let _launcher2 = new Launcher();
      }).not.to.throw();
    });

    it(`Initialize: Runtime persist loaded and settable`, () => {
      let _response = LauncherRuntimePersist.getRuntimePersist().data;
      expect(_response).to.be.equal(LauncherRuntimeConfigurationDefault);

      LauncherRuntimePersist.getRuntimePersist().setData({
        ..._response,
        network: "online",
      });
      expect(LauncherRuntimePersist.getRuntimePersist().data.network).to.eq(
        "online"
      );
    });
  });
});
