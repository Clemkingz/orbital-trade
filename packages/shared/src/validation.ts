/** FR-2.3: min 10 chars. Breached-password check happens server-side. */
export const PASSWORD_MIN_LENGTH = 10;

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (pw.length >= PASSWORD_MIN_LENGTH) score++;
  if (pw.length >= 14) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
