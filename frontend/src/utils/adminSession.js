export function isValidAdminSessionUser(user) {
  return Boolean(
    user &&
      typeof user === "object" &&
      typeof user.uid === "string" &&
      user.uid.trim() &&
      typeof user.email === "string" &&
      user.email.trim(),
  );
}

export function isUnauthorizedSessionError(error) {
  return error?.status === 401;
}

/**
 * Validate the stored admin session without treating ambiguous failures as logout.
 * The caller owns the actual storage/store mutations through these callbacks.
 */
export async function validateStoredAdminSession({
  requestSession,
  onAuthorized,
  onUnauthorized,
}) {
  try {
    const payload = await requestSession();
    if (!isValidAdminSessionUser(payload?.user)) {
      throw new Error("Invalid admin session response");
    }

    onAuthorized?.(payload.user);
    return { status: "authorized", user: payload.user };
  } catch (error) {
    if (isUnauthorizedSessionError(error)) {
      onUnauthorized?.();
      return { status: "unauthorized" };
    }

    return { status: "unknown", error };
  }
}
