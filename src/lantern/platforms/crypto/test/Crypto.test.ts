import { expect } from "chai";
import { createSha1 } from "../common/Crypto";

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
  });
});
