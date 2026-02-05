// Promise helpers.
//
// Kept small and framework-agnostic.

export function withTimeout(promise, ms, timeoutMessage = "Timed out") {
  const timeoutMs = Number(ms);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
