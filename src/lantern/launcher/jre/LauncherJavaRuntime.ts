import { getLauncherMetadata } from "../Launcher";
import querystring from "query-string";
import { AxiosJsonLoader } from "../../utils/request/AxiosHelper";
import { AxiosResponse } from "axios";
import child from "child_process";

export function getCurrentJavaRuntimeVersion() {
  let _ = child.spawnSync("java", ["-version"]);
  if (!_ || !_.stderr) return undefined;
  let _searcher = new RegExp("(java|openjdk) version");
  let _firstLine = _.stderr.toString().split("\n")[0];
  if (!_searcher.test(_firstLine)) {
    return undefined;
  }

  return _firstLine.split(" ")[2].replace(/"/g, "");
}

export function hasJavaRuntime() {
  return getCurrentJavaRuntimeVersion() !== undefined;
}

export function buildAssetReleaseAdoptiumUrl(version: number) {
  // let _arch = process.arch;

  let _query = querystring.stringify({
    image_type: "jre",

    architecture: "x64",
  });
  return `${
    getLauncherMetadata().API.Url.AdoptiumAPIUrlV3
  }/assets/feature_releases/${String(version)}/ga?${_query}`;
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

export function fetchJavaRuntimeVersion(
  version: number
): Promise<AxiosResponse<AdoptiumRelease[]>> {
  return AxiosJsonLoader.get(buildAssetReleaseAdoptiumUrl(version));
}
