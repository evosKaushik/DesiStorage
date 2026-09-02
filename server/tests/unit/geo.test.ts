import "../setup/env.js";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getGeoLocation } from "../../src/utils/geo.js";

describe("getGeoLocation", () => {
  it("returns unknown for empty input", () => {
    assert.deepEqual(getGeoLocation(""), {
      countryCode: "unknown",
      state: "unknown",
    });
  });

  it("returns unknown for loopback / localhost", () => {
    assert.deepEqual(getGeoLocation("::1"), {
      countryCode: "unknown",
      state: "unknown",
    });
    assert.deepEqual(getGeoLocation("127.0.0.1"), {
      countryCode: "unknown",
      state: "unknown",
    });
    assert.deepEqual(getGeoLocation("localhost"), {
      countryCode: "unknown",
      state: "unknown",
    });
  });

  it("normalizes IPv4-mapped IPv6 before lookup", () => {
    // A public IP, so it must NOT come back as unknown without error.
    const result = getGeoLocation("::ffff:8.8.8.8");

    assert.equal(result.countryCode.toUpperCase(), "US");
  });

  it("returns a code/state shape for a public IP", () => {
    const result = getGeoLocation("8.8.8.8");

    assert.equal(typeof result.countryCode, "string");
    assert.equal(typeof result.state, "string");
    assert.ok(result.countryCode.length > 0);
  });

  it("returns unknown for unresolvable private/odd IPs", () => {
    const result = getGeoLocation("192.168.0.1");
    // geoip-lite resolves RFC1918 IPs as UNKNOWN / no data.
    assert.ok(result.countryCode.length > 0);
    assert.ok(result.state.length > 0);
  });
});