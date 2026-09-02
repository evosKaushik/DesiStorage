import "../setup/env.js";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../../src/utils/ApiError.js";

describe("ApiError", () => {
  it("is an Error with name ApiError", () => {
    const err = new ApiError(404, "Not found");

    assert.ok(err instanceof Error);
    assert.equal(err.name, "ApiError");
    assert.equal(err.message, "Not found");
  });

  it("exposes the statusCode", () => {
    for (const status of [400, 401, 403, 404, 409, 429, 503]) {
      const err = new ApiError(status, "msg");
      assert.equal(err.statusCode, status);
    }
  });
});