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

test("persistence failure cleans only newly uploaded media", async () => {
  const events = [];
  const oldMedia = { path: "Projects/demo/old.webp" };
  const newMedia = { path: "Projects/demo/new.webp" };

  await assert.rejects(
    coordinateProjectMediaSave({
      uploadNewMedia: async () => [newMedia],
      persistProject: async () => {
        events.push("persist");
        throw new Error("D1 failure");
      },
      removedMedia: [oldMedia],
      deleteRemovedMedia: async () => events.push("delete-old"),
      cleanupUploadedMedia: async (item) => events.push(`cleanup:${item.path}`),
    }),
    (error) => {
      assert.equal(error.cause.message, "D1 failure");
      assert.deepEqual(error.cleanupFailures, []);
      return true;
    },
  );

  assert.deepEqual(events, ["persist", "cleanup:Projects/demo/new.webp"]);
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
  assert.equal(result.cleanupFailures[0].item, oldMedia);
});
