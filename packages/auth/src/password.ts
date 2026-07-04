import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { ok: true } | { ok: false; reason: string } {
  if (password.length < 8) {
    return { ok: false, reason: "Password must be at least 8 characters." };
  }
  return { ok: true };
}
