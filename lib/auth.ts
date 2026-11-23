import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySession, type Session } from "./session";
import { getSetting } from "./db";

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return verifySession(c.get(COOKIE)?.value);
}

/** Lecturer session is valid only if it was issued after the last password change. */
export async function isAdmin(s: Session | null) {
  if (!s || s.role !== "admin") return false;
  const ver = (await getSetting("admin_session_ver")) || "0";
  return (s.ver || "0") === ver;
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!(await isAdmin(s))) redirect(s ? "/logout" : "/login");
  return s!;
}

export async function requireStudent(): Promise<Session & { sid: number }> {
  const s = await getSession();
  if (!s || s.role !== "student" || !s.sid) redirect("/login");
  return s as Session & { sid: number };
}

/** Lecturer profile shown in the app and on the login page. */
export async function adminProfile() {
  const [name, username] = await Promise.all([getSetting("admin_display_name"), getSetting("admin_username")]);
  return { name: name || "Sir Aiman", username: username || "" };
}
