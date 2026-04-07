import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "acaz-secret-key-dev";

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function signToken(payload: { id: number; email: string; role: string; professionalId: number | null }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: number; email: string; role: string; professionalId: number | null } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string; professionalId: number | null };
  } catch {
    return null;
  }
}
