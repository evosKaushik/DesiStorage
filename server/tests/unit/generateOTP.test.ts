import "../setup/env.js";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateOTP } from "../../src/utils/generateOTP.js";

describe("generateOTP", () => {
  it("always returns exactly 6 digits", () => {
    for (let i = 0; i < 200; i++) {
      const otp = generateOTP();
      assert.match(otp, /^\d{6}$/);
    }
  });

  it("stays within the numeric 000000..999999 range", () => {
    for (let i = 0; i < 200; i++) {
      const value = Number(generateOTP());
      assert.ok(value >= 0 && value <= 999999);
    }
  });

  it("produces leading-zero padding (eventually)", () => {
    let sawPadded = false;
    for (let i = 0; i < 500; i++) {
      if (generateOTP().startsWith("0")) {
        sawPadded = true;
        break;
      }
    }
    assert.equal(sawPadded, true);
  });

  it("produces varying values across calls", () => {
    const values = new Set(Array.from({ length: 100 }, () => generateOTP()));
    assert.ok(values.size > 1);
  });
});