// Small async utility helpers.

/**
 * Wrap a promise with a timeout.
 * If the promise doesn't settle within `ms`, the returned promise rejects.
 */
export function withTimeout(promise, ms, message = "Operation timed out") {
  const timeoutMs = Number(ms);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
