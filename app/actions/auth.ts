"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { COOKIE, signSession } from "@/lib/session";
import { requireStudent } from "@/lib/auth";

async function setCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function login(_: any, fd: FormData) {
  const role = fd.get("role");
  if (role === "admin") {
    const pw = String(fd.get("password") || "");
    if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) return { error: "Incorrect password." };
    await setCookie(await signSession({ role: "admin", name: "Sir Aiman" }));
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
