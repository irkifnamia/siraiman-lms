"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db, getSetting, setSetting } from "@/lib/db";
import { COOKIE, signSession } from "@/lib/session";
import { adminProfile, requireAdmin, requireStudent } from "@/lib/auth";

async function setCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function login(_: any, fd: FormData) {
  const role = fd.get("role");
  if (role === "admin") {
    const user = String(fd.get("username") || "").trim().toLowerCase();
    const pw = String(fd.get("password") || "");
    const [hash, uname, ver] = await Promise.all([getSetting("admin_password_hash"), getSetting("admin_username"), getSetting("admin_session_ver")]);
    // Backup: the ADMIN_PASSWORD set in Vercel always works (recovery if the app password is forgotten).
    const backup = !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
    const userOk = !uname || user === uname.toLowerCase();
    const pwOk = hash ? await bcrypt.compare(pw, hash) : false;
    if (!backup && !(userOk && pwOk)) return { error: uname ? "Incorrect username or password." : "Incorrect password." };
    const { name } = await adminProfile();
    await setCookie(await signSession({ role: "admin", name, ver: ver || "0" }));
    redirect("/admin");
  }
  const matric = String(fd.get("matric") || "").trim().toUpperCase();
  const pin = String(fd.get("pin") || "").trim();
  const r = await db()`SELECT id, nickname, full_name, class_code, pin_hash, active FROM students WHERE upper(matric) = ${matric}`;
  const s = r[0];
  if (!s || !s.active) return { error: "Matric number not found." };
  const ok = s.pin_hash ? await bcrypt.compare(pin, s.pin_hash) : pin === matric.slice(-4);
  if (!ok) return { error: "Incorrect PIN." };
  await db()`UPDATE students SET last_login = now() WHERE id = ${s.id}`;
  await setCookie(await signSession({ role: "student", sid: s.id, name: s.nickname || s.full_name, cls: s.class_code }));
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

export async function changePin(_: any, fd: FormData) {
  const s = await requireStudent();
  const cur = String(fd.get("current") || "");
  const next = String(fd.get("next") || "");
  if (!/^\d{4,8}$/.test(next)) return { error: "New PIN must be 4–8 digits." };
  const r = await db()`SELECT matric, pin_hash FROM students WHERE id = ${s.sid}`;
  const ok = r[0].pin_hash ? await bcrypt.compare(cur, r[0].pin_hash) : cur === String(r[0].matric).slice(-4);
  if (!ok) return { error: "Current PIN is incorrect." };
  await db()`UPDATE students SET pin_hash = ${await bcrypt.hash(next, 10)} WHERE id = ${s.sid}`;
  return { ok: "PIN updated." };
}

/** Lecturer: change display name, username and/or password. */
export async function updateAccount(_: any, fd: FormData) {
  await requireAdmin();
  const name = String(fd.get("name") || "").trim();
  const username = String(fd.get("username") || "").trim().toLowerCase();
  const current = String(fd.get("current") || "");
  const next = String(fd.get("next") || "");
  const confirm = String(fd.get("confirm") || "");
  if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) return { error: "Username: 3–30 characters, letters, numbers, . _ - only." };

  const hash = await getSetting("admin_password_hash");
  const currentOk = (hash && (await bcrypt.compare(current, hash))) || (!!process.env.ADMIN_PASSWORD && current === process.env.ADMIN_PASSWORD);
  if (!currentOk) return { error: "Current password is incorrect." };

  if (name) await setSetting("admin_display_name", name.slice(0, 40));
  await setSetting("admin_username", username || null);
  let msg = "Account updated.";
  if (next) {
    if (next.length < 8) return { error: "New password must be at least 8 characters." };
    if (next !== confirm) return { error: "New passwords don't match." };
    await setSetting("admin_password_hash", await bcrypt.hash(next, 10));
    // sign out every other device, then re-issue this device's session
    const ver = Date.now().toString(36);
    await setSetting("admin_session_ver", ver);
    await setCookie(await signSession({ role: "admin", name: name || (await adminProfile()).name, ver }));
    msg = "Password changed. Other devices have been signed out.";
  } else if (name) {
    const ver = (await getSetting("admin_session_ver")) || "0";
    await setCookie(await signSession({ role: "admin", name, ver }));
  }
  revalidatePath("/admin", "layout");
  return { ok: msg };
}
