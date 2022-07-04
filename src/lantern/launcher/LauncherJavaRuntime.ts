import { URL } from "url";
import path from "path";
import { getLauncherMetadata } from "./Launcher";
import querystring from "query-string";
import { AxiosJsonLoader } from "../utils/request/AxiosHelper";
import { AxiosResponse } from "axios";
import child from "child_process";
import {
  isMacOS,
  isWindows,
} from "../platforms/environment/common/Environment";
import fs from "fs";
import {
  getDownloadedRuntimeFilePath,
  getDownloadedRuntimeJavaHome,
} from "./LauncherGameAsset";

export function getCurrentJavaRuntimeVersion() {
  // Check launcher runtime is exist or not
  let javaHome = "java";
  if (fs.existsSync(getDownloadedRuntimeFilePath())) {
    javaHome = getDownloadedRuntimeJavaHome();
  }

  let _ = child.spawnSync(javaHome, ["-version"]);
  if (!_ || !_.stderr) return undefined;
  let _searcher = new RegExp("(java|openjdk) version");
  let _firstLine = _.stderr.toString().split("\n")[0];
  if (!_searcher.test(_firstLine)) {
    return undefined;
  }

  return new JavaRuntimeVersion(_firstLine.split(" ")[2].replace(/"/g, ""));
}

export function hasJavaRuntime() {
  return getCurrentJavaRuntimeVersion() !== undefined;
}

export function buildAssetReleaseAdoptiumUrl(version: number) {
  let _query = querystring.stringify({
    image_type: "jre",
    os: isWindows() ? "windows" : isMacOS() ? "mac" : "linux",
    architecture: process.arch === "x64" ? "x64" : "x32",
    vendor: "eclipse",
  });

  return new URL(
    path.join(`assets`, `latest`, String(version), `hotspot?${_query}`),
    getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
  );
}

interface AdoptiumResponseDownloadContent {
  name: string;
  link: string;
  size: number;
  checksum: string;
  checksum_link: string;
  signature_link: string;
  download_count: number;
  meta_link: string;
}

interface AdoptiumReleaseBinary {
  os: "linux" | "windows" | "mac" | "solaris" | "aix" | "alpine-linux";
  architecture:
    | "x64"
    | "x32"
    | "x86"
    | "ppc64"
    | "ppc641e"
    | "s390x"
    | "aarch64"
    | "arm"
    | "sparcv9"
    | "risc64";
  // [ jdk, jre, testimage, debugimage, staticlibs, sources ]
  image_type:
    | "jdk"
    | "jre"
    | "testimage"
    | "debugimage"
    | "stasticlibs"
    | "sources";
  c_lib: "musl" | "glibc";
  jvm_impl: "hotspot" | "openj9" | "dragonwell";
  heap_size: "normal" | "large";
  download_count: number;
  updated_at: Date | string;
  scr_ref: string;
  project: "jdk" | "valhalla" | "metropolis" | "jfr" | "shenandoah";
  package: {
    checksum: string;
    checksum_link: URL;
    download_count: number;
    link: string;
    metadata_link: string;
    name: string;
    size: number;
  };
}

interface AdoptiumRelease {
  id: string;
  release_link: string;
  release_name: string;
  timestamp: Date | string;
  updatedAt: Date | string;
  binaries: AdoptiumReleaseBinary[];
  download_count: number;
  release_type: "ga" | "ea";
  // adoptopenjdk, openjdk, eclipse, alibaba, ibm
  vendor: "adoptopenjdk" | "openjdk" | "eclipse" | "alibaba" | "ibm";
  version_data: {
    major: number;
    minor: number;
    security: number;
    patch: number;
    pre: string;
    adopt_build_number: number;
    semver: string;
    openjdk_version: string;
    build: number;
    optional: string;
  };
  source: {
    name: string;
    link: string;
    size: number;
  };
}

export interface AdoptiumReleaseResponse {
  data: AdoptiumRelease[];
}

export async function fetchJavaRuntimeVersion(
  version: number
): Promise<AxiosResponse<AdoptiumLatestRelease.Response[]>> {
  let _ = buildAssetReleaseAdoptiumUrl(version).toString();
  return await AxiosJsonLoader.get(_);
}

export class JavaRuntimeVersion {
  major?: string;
  minor?: string;
  patch?: string;

  constructor(version: string) {
    if (version.split(".").length === 0) {
      throw new Error("Invalid version sematic");
    }
    const [major, minor, patch] = version.split(".");

    if (major) this.major = major;
    if (minor) this.minor = minor;
    if (patch) this.patch = patch;
  }
}

declare module AdoptiumLatestRelease {
  export interface Installer {
    checksum: string;
    checksum_link: string;
    download_count: number;
    link: string;
    metadata_link: string;
    name: string;
    size: number;
  }

  export interface Package {
    checksum: string;
    checksum_link: string;
    download_count: number;
    link: string;
    metadata_link: string;
    name: string;
    size: number;
  }

  export interface Binary {
    architecture: string;
    download_count: number;
    heap_size: string;
    image_type: string;
    installer: Installer;
    jvm_impl: string;
    os: string;
    package: Package;
    project: string;
    scm_ref: string;
    updated_at: Date;
  }

  export interface Version {
    build: number;
    major: number;
    minor: number;
    openjdk_version: string;
    security: number;
    semver: string;
  }

  export interface Response {
    binary: Binary;
    release_link: string;
    release_name: string;
    vendor: string;
    version: Version;
  }
}
