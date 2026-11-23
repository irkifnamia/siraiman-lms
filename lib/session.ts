import { SignJWT, jwtVerify } from "jose";

export type Session = {
  role: "admin" | "student";
  sid?: number;
  name: string;
  cls?: string;
};

export const COOKIE = "lms_session";

function key() {
  const s = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(s);
}

export async function signSession(s: Session) {
  return new SignJWT(s as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
