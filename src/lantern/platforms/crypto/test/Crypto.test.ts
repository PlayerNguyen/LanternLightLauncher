import crypto from "crypto";
import { expect } from "chai";
import { createSha1, createSHA256 } from "../common/Crypto";

describe("Crypto", () => {
  describe("createSha1", () => {
    let _sample = [
      {
        input: "thisisahash",
        output: "9ecda0116eb508285106053a58cbbff6ea88a652",
      },
      {
        input: "match",
        output: "ef5c844eab88bcaca779bd2f3ad67b573bbbbfca",
      },
      {
        input: "#pd0u&Y&zoc",
        output: "616bb3c4f4ca83c3c1e202d6d3cf209b238fe18c",
      },
    ];
    it(`Create expected value`, () => {
      _sample.forEach(({ input, output }) => {
        expect(createSha1(input)).to.equal(output);
      });
    });
    it(`Empty input`, () => {
      expect(() => {
        // @ts-ignore
        createSha1(undefined as crypto.BinaryLike);
      }).throws();
    });
  });
  describe("createSha256", () => {
    let _sample = [
      {
        input: "lorem isuw juszj nanix mo hamster unicorn",
        output:
          "90151213a11cedc26a1b1c3f5bbd84fb724877aee170a2d1beabd5c2fab10e68",
      },
    ];
    it(`Create expected value`, () => {
      _sample.forEach(({ input, output }) => {
        expect(createSHA256(input)).to.equal(output);
      });
    });
    it(`Empty input`, () => {
      expect(() => {
        // @ts-ignore
        createSHA256(undefined as crypto.BinaryLike);
      }).throws();
    });
  });
});
