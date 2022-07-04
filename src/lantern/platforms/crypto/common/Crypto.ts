import crypto from "crypto";

/**
 * Create a SHA1 hash from specific input
 * @param input an input as binary like to hash
 * @returns output as hex
 */
export function createSha1(input: crypto.BinaryLike | string): string {
  if (input === null || input === undefined) {
    throw new Error("Input cannot be null or undefined");
  }
  let _hash = crypto.createHash("sha1");
  return _hash.update(input).digest("hex");
}
/**
 * Create a SHA256 hash from specific input
 * @param input an input as binary like to hash
 * @returns output as hex which hash the input to sha256 output
 */
export function createSHA256(input: crypto.BinaryLike | string): string {
  if (input === null || input === undefined) {
    throw new Error("Input cannot be null or undefined");
  }
  let _hash = crypto.createHash("sha256");
  return _hash.update(input).digest("hex");
}
