import { AxiosResponse } from "axios";
import { AxiosStreamLoader } from "../utils/request/AxiosHelper";
import { getLauncherMetadata } from "./Launcher";
import stream from 'node:stream'

export interface MinecraftManifestLatestVersion {
  release: string;
  snapshot: string;
}

export interface MinecraftManifestVersion {
  id: string;
  type: "snapshot" | "release";
  url: URL;
  time: Date;
  releaseTime: Date;
}

export interface MinecraftManifest {
  latest: MinecraftManifestLatestVersion;
  versions: MinecraftManifestVersion[];
}

export function fetchMinecraftManifest(): Promise<
  AxiosResponse<stream.Readable>
> {
  let _url = getLauncherMetadata().API.Url.MinecraftVersionManifestUrl;
  return AxiosStreamLoader.get(_url);
}
