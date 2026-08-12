import assert from "node:assert/strict";
import test from "node:test";

import { apiFetch } from "../src/utils/cloudflareApi.js";

test("apiFetch retains the Worker persistence outcome marker", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ error: "Project persistence rejected", persistenceOutcome: "rejected" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );

  try {
    await assert.rejects(
      apiFetch("/api/admin/projects/upsert", {
        method: "POST",
        body: { document: {} },
      }),
      (error) => {
        assert.equal(error.status, 500);
        assert.equal(error.persistenceOutcome, "rejected");
        assert.equal(error.payload.persistenceOutcome, "rejected");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
