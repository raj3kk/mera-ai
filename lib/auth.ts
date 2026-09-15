import { cookies } from "next/headers";

export const OWNER_COOKIE = "mera_owner";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** True once an owner password has been configured (env var present). */
export function ownerConfigured(): boolean {
  return !!process.env.OWNER_PASSWORD;
}

/** True when the request carries a valid owner cookie. */
export function isOwner(): boolean {
  const pw = process.env.OWNER_PASSWORD;
  if (!pw) return false;
  return cookies().get(OWNER_COOKIE)?.value === pw;
}

/**
 * /settings bootstrap rule: reachable when no password is configured yet
 * (first-run setup), otherwise only for the owner.
 */
export function allowSettingsAccess(): boolean {
  return !ownerConfigured() || isOwner();
}

export function ownerCookieHeader(): string {
  const pw = process.env.OWNER_PASSWORD ?? "";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${OWNER_COOKIE}=${encodeURIComponent(pw)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}
