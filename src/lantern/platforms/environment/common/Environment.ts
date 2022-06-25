import { platform } from "process";

/**
 * Check whether the node environment is a developer.
 *
 * @returns {boolean} true if the process.env.NODE_ENV is set to "development", false otherwise.
 */
export function isDevelopment(): boolean {
  if (!process.env.NODE_ENV) return false;
  return process.env.NODE_ENV.trim().toLowerCase() === "development";
}

/**
 *  Returns  a NodeJS version
 * @returns {string} a node version with
 */
export function getNodeVersion(): string {
  return process.version;
}

/**
 * Check whether the node environment is a testing environment.
 * @returns {boolean} true if the trimmed and lower case of process.env.NODE_ENV is equal "test"
 */
export function isTesting(): boolean {
  if (!process.env.NODE_ENV) return false;
  return process.env.NODE_ENV.trim().toLowerCase() === "test";
}

/**
 * Check if the current platform is darwin (MacOS).
 * @returns true if the current platform is darwin (MacOS), false otherwise
 */
export function isMacOS() {
  return platform === "darwin";
}

/**
 *
 * @returns true if the current platform is Windows OS, false otherwise
 */
export function isWindows() {
  return platform === "win32";
}

/**
 *
 * @returns true if the current platform is Linux, false otherwise.
 */
export function isLinux() {
  return platform === "linux";
}
