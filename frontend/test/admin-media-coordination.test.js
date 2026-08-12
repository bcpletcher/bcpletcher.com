import assert from "node:assert/strict";
import test from "node:test";

import { coordinateProjectMediaSave } from "../src/utils/adminMediaCoordination.js";

test("media save uploads, persists, then deletes removed media", async () => {
  const events = [];
  const oldMedia = { path: "Projects/demo/old.webp" };
  const newMedia = { path: "Projects/demo/new.webp" };

  const result = await coordinateProjectMediaSave({
    uploadNewMedia: async () => {
      events.push("upload");
      return [newMedia];
    },
    persistProject: async () => events.push("persist"),
    removedMedia: [oldMedia],
    deleteRemovedMedia: async (item) => events.push(`delete:${item.path}`),
    cleanupUploadedMedia: async (item) => events.push(`cleanup:${item.path}`),
  });

  assert.deepEqual(events, [
    "upload",
    "persist",
    "delete:Projects/demo/old.webp",
  ]);
  assert.deepEqual(result.cleanupFailures, []);
});

test("definite HTTP persistence rejection cleans only newly uploaded media", async () => {
  for (const status of [400, 401, 500]) {
    const events = [];
    const oldMedia = { path: "Projects/demo/old.webp" };
    const newMedia = { path: "Projects/demo/new.webp" };

    await assert.rejects(
      coordinateProjectMediaSave({
        uploadNewMedia: async () => [newMedia],
        persistProject: async () => {
          events.push("persist");
          throw Object.assign(new Error("D1 rejected"), {
            status,
            payload: { persistenceOutcome: "rejected" },
            persistenceOutcome: "rejected",
          });
        },
        removedMedia: [oldMedia],
        deleteRemovedMedia: async () => events.push("delete-old"),
        cleanupUploadedMedia: async (item) => events.push(`cleanup:${item.path}`),
      }),
      (error) => {
        assert.equal(error.cause.message, "D1 rejected");
        assert.equal(error.persistenceOutcome, "rejected");
        assert.deepEqual(error.cleanupFailures, []);
        return true;
      },
    );

    assert.deepEqual(events, ["persist", "cleanup:Projects/demo/new.webp"]);
  }
});

test("unmarked HTTP 500/502 responses remain unknown and do not clean uploads", async () => {
  for (const status of [500, 502]) {
    const events = [];
    const oldMedia = { path: "Projects/demo/old.webp" };
    const newMedia = { path: "Projects/demo/new.webp" };

    await assert.rejects(
      coordinateProjectMediaSave({
        uploadNewMedia: async () => [newMedia],
        persistProject: async () => {
          events.push("persist");
          throw Object.assign(new Error("edge response"), {
            status,
            payload: { error: "Internal error" },
          });
        },
        removedMedia: [oldMedia],
        deleteRemovedMedia: async () => events.push("delete-old"),
        cleanupUploadedMedia: async () => events.push("cleanup-new"),
      }),
      (error) => {
        assert.equal(error.persistenceOutcome, "unknown");
        assert.deepEqual(error.uploadedMedia, [newMedia]);
        return true;
      },
    );

    assert.deepEqual(events, ["persist"]);
  }
});

test("status-less persistence outcome preserves uploaded paths for reconciliation", async () => {
  const events = [];
  const oldMedia = { path: "Projects/demo/old.webp" };
  const newMedia = { path: "Projects/demo/new.webp" };

  await assert.rejects(
    coordinateProjectMediaSave({
      uploadNewMedia: async () => [newMedia],
      persistProject: async () => {
        events.push("persist");
        throw new Error("response lost after commit");
      },
      removedMedia: [oldMedia],
      deleteRemovedMedia: async () => events.push("delete-old"),
      cleanupUploadedMedia: async () => events.push("cleanup-new"),
    }),
    (error) => {
      assert.equal(error.persistenceOutcome, "unknown");
      assert.deepEqual(error.uploadedMedia, [newMedia]);
      assert.deepEqual(error.cleanupFailures, []);
      return true;
    },
  );

  assert.deepEqual(events, ["persist"]);
});

test("successful persistence reports old-media cleanup failures", async () => {
  const oldMedia = { path: "Projects/demo/old.webp" };
  const result = await coordinateProjectMediaSave({
    uploadNewMedia: async () => [],
    persistProject: async () => {},
    removedMedia: [oldMedia],
    deleteRemovedMedia: async () => {
      throw new Error("R2 unavailable");
    },
    cleanupUploadedMedia: async () => {},
  });

  assert.equal(result.cleanupFailures.length, 1);
  assert.equal(result.persistenceOutcome, "confirmed");
  assert.equal(result.cleanupFailures[0].item, oldMedia);
});

test("definite rejection reports new-media cleanup failures without deleting old media", async () => {
  const events = [];
  const oldMedia = { path: "Projects/demo/old.webp" };
  const newMedia = { path: "Projects/demo/new.webp" };

  await assert.rejects(
    coordinateProjectMediaSave({
      uploadNewMedia: async () => [newMedia],
      persistProject: async () => {
        throw Object.assign(new Error("D1 rejected"), {
          status: 400,
          payload: { persistenceOutcome: "rejected" },
          persistenceOutcome: "rejected",
        });
      },
      removedMedia: [oldMedia],
      deleteRemovedMedia: async () => events.push("delete-old"),
      cleanupUploadedMedia: async () => {
        events.push("cleanup-new");
        throw new Error("R2 cleanup unavailable");
      },
    }),
    (error) => {
      assert.equal(error.persistenceOutcome, "rejected");
      assert.equal(error.cleanupFailures.length, 1);
      return true;
    },
  );

  assert.deepEqual(events, ["cleanup-new"]);
});
