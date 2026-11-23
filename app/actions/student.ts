"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { driveConnected, uploadSubmission } from "@/lib/drive";

export async function submitTask(_: any, fd: FormData) {
  const s = await requireStudent();
  const aid = Number(fd.get("assignment_id"));
  const note = String(fd.get("note") || "").trim() || null;
  const link = String(fd.get("link") || "").trim();
  const file = fd.get("file") as File | null;

  const a = (await db()`SELECT * FROM assignments WHERE id = ${aid} AND published AND (class_code IS NULL OR class_code = ${s.cls})`)[0];
  if (!a) return { error: "Task not found." };
  const prev = (await db()`SELECT status FROM submissions WHERE assignment_id = ${aid} AND student_id = ${s.sid}`)[0];
  if (prev?.status === "returned") return { error: "This task has already been marked and returned." };

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  try {
    if (file && file.size > 0) {
      if (!(await driveConnected())) return { error: "File upload isn't enabled yet — paste a Google Drive link instead." };
      const st = (await db()`SELECT matric, nickname FROM students WHERE id = ${s.sid}`)[0];
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      fileName = `${st.matric}_${st.nickname}${ext}`;
      const id = await uploadSubmission(file, fileName, s.cls || "", `${a.title} (#${a.id})`);
      fileUrl = `drive:${id}`;
      fileName = file.name;
    } else if (link) {
      if (!/^https?:\/\//i.test(link)) return { error: "Link must start with https://" };
      fileUrl = link;
      fileName = "Link";
    } else return { error: "Attach a file or paste a link." };
  } catch (e: any) {
    return { error: e.message || "Upload failed." };
  }

  await db()`
    INSERT INTO submissions (assignment_id, student_id, file_url, file_name, note, submitted_at, status)
    VALUES (${aid}, ${s.sid}, ${fileUrl}, ${fileName}, ${note}, now(), 'submitted')
    ON CONFLICT (assignment_id, student_id) DO UPDATE
      SET file_url = EXCLUDED.file_url, file_name = EXCLUDED.file_name, note = EXCLUDED.note, submitted_at = now()`;
  revalidatePath(`/tasks/${aid}`);
  revalidatePath("/tasks");
  return { ok: "Submitted. You can resubmit until it's marked." };
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
