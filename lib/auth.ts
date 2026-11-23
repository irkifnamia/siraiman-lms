import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySession, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return verifySession(c.get(COOKIE)?.value);
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "admin") redirect("/login");
  return s;
}

export async function requireStudent(): Promise<Session & { sid: number }> {
  const s = await getSession();
  if (!s || s.role !== "student" || !s.sid) redirect("/login");
  return s as Session & { sid: number };
}
