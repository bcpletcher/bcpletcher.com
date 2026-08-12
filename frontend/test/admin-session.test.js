import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidAdminSessionUser,
  validateStoredAdminSession,
} from "../src/utils/adminSession.js";

test("valid session response authorizes and preserves the returned user", async () => {
  const events = [];
  const user = { uid: "admin", email: "admin@example.test" };
  const result = await validateStoredAdminSession({
    requestSession: async () => ({ user }),
    onAuthorized: (authorizedUser) => events.push(["authorized", authorizedUser]),
    onUnauthorized: () => events.push(["unauthorized"]),
  });

  assert.deepEqual(result, { status: "authorized", user });
  assert.deepEqual(events, [["authorized", user]]);
});

test("HTTP 401 clears the session while transient errors remain unknown", async () => {
  let cleared = 0;
  const unauthorized = await validateStoredAdminSession({
    requestSession: async () => {
      throw Object.assign(new Error("expired"), { status: 401 });
    },
    onUnauthorized: () => {
      cleared += 1;
    },
  });
  assert.deepEqual(unauthorized, { status: "unauthorized" });
  assert.equal(cleared, 1);

  const transientError = new Error("network unavailable");
  const unknown = await validateStoredAdminSession({
    requestSession: async () => {
      throw transientError;
    },
    onUnauthorized: () => {
      cleared += 1;
    },
  });
  assert.equal(unknown.status, "unknown");
  assert.equal(unknown.error, transientError);
  assert.equal(cleared, 1);
});

test("session validation rejects malformed user claims without logging out", async () => {
  let cleared = false;
  for (const user of [null, {}, { uid: 7, email: "admin@example.test" }, { uid: "admin", email: 8 }]) {
    assert.equal(isValidAdminSessionUser(user), false);
    const result = await validateStoredAdminSession({
      requestSession: async () => ({ user }),
      onUnauthorized: () => {
        cleared = true;
      },
    });
    assert.equal(result.status, "unknown");
  }
  assert.equal(cleared, false);
  assert.equal(isValidAdminSessionUser({ uid: "admin", email: "admin@example.test" }), true);
});
