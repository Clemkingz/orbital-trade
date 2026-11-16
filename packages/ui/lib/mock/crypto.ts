/**
 * Browser-side helpers for the mock data layer (Web Crypto).
 * Demo only: real password hashing and TOTP verification belong on a server.
 */
const enc = new TextEncoder();

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const randomId = (prefix = "") => `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
export const sixDigitCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");

export async function hashPassword(password: string, salt = randomId()) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${salt}:${password}`));
  return { salt, hash: hex(digest) };
}

export async function checkPassword(password: string, salt: string, hash: string) {
  return (await hashPassword(password, salt)).hash === hash;
}

/* ── TOTP (RFC 6238) — works with Google Authenticator, Authy, 1Password ── */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(s: string) {
  let bits = "";
  for (const c of s.toUpperCase()) {
    const v = B32.indexOf(c);
    if (v >= 0) bits += v.toString(2).padStart(5, "0");
  }
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return out;
}

async function hotp(secret: string, counter: number) {
  const key = await crypto.subtle.importKey("raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new ArrayBuffer(8);
  new DataView(msg).setBigUint64(0, BigInt(counter));
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

/** Accepts the current 30-second code and one step either side. */
export async function verifyTotp(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const step = Math.floor(Date.now() / 30_000);
  for (const d of [-1, 0, 1]) if ((await hotp(secret, step + d)) === code) return true;
  return false;
}

export const otpauthUrl = (secret: string, account: string, issuer: string) =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

/** Shrinks an uploaded image to a JPEG data URL so it fits in browser storage. */
export async function imageToDataUrl(file: Blob, max = 720): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  }
}
