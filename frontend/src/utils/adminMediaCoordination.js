function collectFailures(items, results) {
  return results
    .map((result, index) =>
      result.status === "rejected"
        ? { item: items[index], error: result.reason }
        : null,
    )
    .filter(Boolean);
}

export function hasDefiniteHttpRejection(error) {
  return Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599;
}

/**
 * Coordinate a project save so old media is deleted only after persistence.
 * New media is cleaned up when persistence fails; removed media is never part
 * of that failure cleanup set.
 */
export async function coordinateProjectMediaSave({
  uploadNewMedia,
  persistProject,
  removedMedia = [],
  deleteRemovedMedia,
  cleanupUploadedMedia,
}) {
  const uploadedMedia = await uploadNewMedia();

  try {
    await persistProject(uploadedMedia);
  } catch (error) {
    const persistenceOutcome = hasDefiniteHttpRejection(error)
      ? "rejected"
      : "unknown";
    const cleanupResults = persistenceOutcome === "rejected"
      ? await Promise.allSettled(
        uploadedMedia.map((item) => cleanupUploadedMedia(item)),
      )
      : [];
    const cleanupFailures = persistenceOutcome === "rejected"
      ? collectFailures(uploadedMedia, cleanupResults)
      : [];
    const wrapped = new Error("Project persistence failed", { cause: error });
    wrapped.uploadedMedia = uploadedMedia;
    wrapped.cleanupFailures = cleanupFailures;
    wrapped.persistenceOutcome = persistenceOutcome;
    throw wrapped;
  }

  const deleteResults = await Promise.allSettled(
    removedMedia.map((item) => deleteRemovedMedia(item)),
  );

  return {
    uploadedMedia,
    cleanupFailures: collectFailures(removedMedia, deleteResults),
    persistenceOutcome: "confirmed",
  };
}
