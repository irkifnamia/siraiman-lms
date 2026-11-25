"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { submitWork } from "@/lib/submit";

export async function submitTask(prev: any, fd: FormData) {
  try {
    const st = await requireStudent();
    return await submitWork(st, fd);
  } catch (e: any) {
    if (String(e?.digest || "").startsWith("NEXT_")) throw e;
    console.error("submitTask failed", e);
    return { error: "Upload failed on the server. Please try again in a minute." };
  }
}

export async function submitInfo(_: any, fd: FormData) {
  const s = await requireStudent();
  const rid = Number(fd.get("request_id"));
  const { requestsForStudent, validateAnswers } = await import("@/lib/info");
  const r = (await requestsForStudent(s.sid, s.cls!)).find((x: any) => x.id === rid);
  if (!r) return { error: "This request isn't for you." };
  if (!r.open) return { error: "This request is closed." };
  const raw: Record<string, string> = {};
  for (const f of r.fields) raw[f.id] = String(fd.get(`f_${f.id}`) ?? "");
  const v = validateAnswers(r.fields, raw);
  if ("error" in v) return { error: v.error };
  await db()`INSERT INTO info_responses(request_id, student_id, answers, updated_at)
    VALUES (${rid}, ${s.sid}, ${JSON.stringify(v.answers)}::jsonb, now())
    ON CONFLICT (request_id, student_id) DO UPDATE SET answers = EXCLUDED.answers, updated_at = now()`;
  revalidatePath("/info");
  revalidatePath(`/info/${rid}`);
  return { ok: "Saved. You can update your answers until the request closes.", at: Date.now() };
}
