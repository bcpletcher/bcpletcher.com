function collectFailures(items, results) {
  return results
    .map((result, index) =>
      result.status === "rejected"
        ? { item: items[index], error: result.reason }
        : null,
    )
    .filter(Boolean);
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
    const cleanupResults = await Promise.allSettled(
      uploadedMedia.map((item) => cleanupUploadedMedia(item)),
    );
    const cleanupFailures = collectFailures(uploadedMedia, cleanupResults);
    const wrapped = new Error("Project persistence failed", { cause: error });
    wrapped.uploadedMedia = uploadedMedia;
    wrapped.cleanupFailures = cleanupFailures;
    throw wrapped;
  }

  const deleteResults = await Promise.allSettled(
    removedMedia.map((item) => deleteRemovedMedia(item)),
  );

  return {
    uploadedMedia,
    cleanupFailures: collectFailures(removedMedia, deleteResults),
  };
}
