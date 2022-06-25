import { expect } from "chai";
import { platform } from "process";

import {
  getNodeVersion,
  isDevelopment,
  isLinux,
  isMacOS,
  isWindows,
} from "../common/Environment";

function fakeEnvironment(os: string, callback: (platform: string) => void) {
  let _original = Object.getOwnPropertyDescriptor(process, "platform");
  Object.defineProperty(process, "platform", { value: os });
  callback(os);
  Object.defineProperty(process, "platform", _original as PropertyDescriptor);
}

describe(`Environment`, () => {
  it(`Development Environment - returns satisfy which correspond to the environment`, () => {
    let developmentEnvironmentSet = [
      {
        name: "development",
        expectResponse: true,
      },
      {
        name: "testing",
        expectResponse: false,
      },
      {
        name: "production",
        expectResponse: false,
      },
      {
        name: "Development",
        expectResponse: true,
      },
      {
        name: "dev",
        expectResponse: false,
      },
      {
        // With intent or space
        name: " Development",
        expectResponse: true,
      },
      {
        name: " Development",
        expectResponse: true,
      },
    ];
    developmentEnvironmentSet.forEach((val) => {
      process.env.NODE_ENV = val.name.trim();
      val.expectResponse
        ? expect(isDevelopment()).to.be.true
        : expect(isDevelopment()).to.be.false;
    });
  });

  it(`Version - returns version as schema`, () => {
    expect(getNodeVersion()).to.not.be.undefined;
    expect(getNodeVersion().split(".")).length(3);
  });
  it(`Platform - isLinux test`, () => {
    fakeEnvironment("linux", () => {
      expect(isLinux()).to.be.true;
    });
  });
  it(`Platform - isMacOS`, () => {
    fakeEnvironment("darwin", () => {
      expect(isMacOS()).to.be.true;
    });
  });

  it(`Platform - isWindows`, () => {
    fakeEnvironment("win32", () => {
      expect(isWindows()).to.true;
    });
  });
});
