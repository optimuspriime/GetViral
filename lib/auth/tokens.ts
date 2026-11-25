import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const GUEST_COOKIE_NAME = "gv_guest_id";
export const QUOTA_COOKIE_NAME = "gv_quota_state";

const EPHEMERAL_FALLBACK = randomUUID();

function getSigningSecret(): string {
  return (
    process.env.QUOTA_SIGNING_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    EPHEMERAL_FALLBACK
  );
}

/**
 * Signs an arbitrary payload string using HMAC-SHA256 so cookies cannot be forged by clients.
 */
export function signValue(payload: string): string {
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", getSigningSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

/**
 * Verifies an HMAC-SHA256 signed token using constant-time comparison and returns the decoded payload.
 */
export function verifySignedValue(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return null;

  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  const expectedSig = createHmac("sha256", getSigningSecret()).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function parseCookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const rawPair of pairs) {
    const eq = rawPair.indexOf("=");
    if (eq === -1) continue;
    const k = rawPair.slice(0, eq).trim();
    if (k === name) {
      const val = rawPair.slice(eq + 1).trim();
      try {
        return decodeURIComponent(val);
      } catch {
        return val;
      }
    }
  }
  return null;
}

export function createSignedGuestToken(guestId?: string): { guestId: string; signedToken: string } {
  const id = guestId || `guest:${randomUUID()}`;
  return {
    guestId: id,
    signedToken: signValue(id),
  };
}

/**
 * Computes a server-side deterministic guest rate-limit key from client IP headers
 * so clearing cookies or opening incognito windows does not bypass the guest preview cap.
 */
export function hashClientIp(ip: string): string {
  return createHmac("sha256", getSigningSecret()).update(`ip:${ip.trim()}`).digest("hex").slice(0, 24);
}

/**
 * Checks whether an authenticated email is designated as an internal operator via ADMIN_EMAILS.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
