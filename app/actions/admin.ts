"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, setSetting } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { driveConnected, folderIdFrom, uploadToDrive } from "@/lib/drive";
import { fromLocalInput } from "@/lib/format";

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const num = (fd: FormData, k: string) => (str(fd, k) === null ? null : Number(str(fd, k)));

/** Accepts either an uploaded file (field `${prefix}_file`) or a URL (field `${prefix}_url`). */
async function fileOrUrl(fd: FormData, prefix: string, folder: string) {
  const f = fd.get(`${prefix}_file`) as File | null;
  if (f && f.size > 0) {
    if (!(await driveConnected())) throw new Error("Connect Google Drive in Settings to upload files.");
    return `drive:${await uploadToDrive(f, f.name, folder)}`;
  }
  return str(fd, `${prefix}_url`);
}

/* ---------- Announcements ---------- */
export async function saveAnnouncement(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const v = [str(fd, "title"), str(fd, "body"), str(fd, "class_code"), fd.get("pinned") === "on"] as const;
  if (!v[0] || !v[1]) return;
  if (id) await db()`UPDATE announcements SET title=${v[0]}, body=${v[1]}, class_code=${v[2]}, pinned=${v[3]} WHERE id=${id}`;
  else await db()`INSERT INTO announcements(title, body, class_code, pinned) VALUES (${v[0]}, ${v[1]}, ${v[2]}, ${v[3]})`;
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}
export async function deleteAnnouncement(fd: FormData) {
  await requireAdmin();
  await db()`DELETE FROM announcements WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/announcements");
}
export async function togglePin(fd: FormData) {
  await requireAdmin();
  await db()`UPDATE announcements SET pinned = NOT pinned WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/announcements");
}

/* ---------- Learning plan ---------- */
export async function savePlan(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const week = num(fd, "week"), topic = str(fd, "topic");
  if (!week || !topic) return;
  const [sd, sub, obj, act, url, status] = [str(fd, "start_date"), str(fd, "subtopics"), str(fd, "objectives"), str(fd, "activities"), str(fd, "resource_url"), str(fd, "status") || "planned"];
  if (id) await db()`UPDATE learning_plan SET week=${week}, start_date=${sd}, topic=${topic}, subtopics=${sub}, objectives=${obj}, activities=${act}, resource_url=${url}, status=${status} WHERE id=${id}`;
  else await db()`INSERT INTO learning_plan(week, start_date, topic, subtopics, objectives, activities, resource_url, status) VALUES (${week}, ${sd}, ${topic}, ${sub}, ${obj}, ${act}, ${url}, ${status})`;
  revalidatePath("/admin/plan");
  redirect("/admin/plan");
}
export async function setPlanStatus(fd: FormData) {
  await requireAdmin();
  await db()`UPDATE learning_plan SET status = ${str(fd, "status")} WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/plan");
}
export async function deletePlan(fd: FormData) {
  await requireAdmin();
  await db()`DELETE FROM learning_plan WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/plan");
}

/* ---------- Assignments ---------- */
export async function saveAssignment(_: any, fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };
  let att: string | null;
  try {
    att = (await fileOrUrl(fd, "attachment", "Task attachments")) ?? (str(fd, "attachment_keep")?.startsWith("drive:") ? str(fd, "attachment_keep") : null);
  } catch (e: any) {
    return { error: e.message };
  }
  const v = {
    description: str(fd, "description"), kind: str(fd, "kind") || "Tutorial", cls: str(fd, "class_code"),
    due: fromLocalInput(str(fd, "due_at")), max: num(fd, "max_mark") ?? 100, published: fd.get("published") === "on",
  };
  let aid = id;
  if (id) {
    await db()`UPDATE assignments SET title=${title}, description=${v.description}, kind=${v.kind}, class_code=${v.cls}, due_at=${v.due}, max_mark=${v.max}, attachment_url=${att}, published=${v.published} WHERE id=${id}`;
  } else {
    const r = await db()`INSERT INTO assignments(title, description, kind, class_code, due_at, max_mark, attachment_url, published)
      VALUES (${title}, ${v.description}, ${v.kind}, ${v.cls}, ${v.due}, ${v.max}, ${att}, ${v.published}) RETURNING id`;
    aid = r[0].id;
  }
  revalidatePath("/admin/assignments");
  redirect(`/admin/assignments/${aid}`);
}
export async function deleteAssignment(fd: FormData) {
  await requireAdmin();
  await db()`DELETE FROM assignments WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/assignments");
  redirect("/admin/assignments");
}

/* ---------- Mark & return ---------- */
export async function markSubmission(_: any, fd: FormData) {
  await requireAdmin();
  const aid = num(fd, "assignment_id")!, sid = num(fd, "student_id")!;
  const mark = num(fd, "mark"), feedback = str(fd, "feedback");
  const ret = fd.get("intent") === "return";
  const a = (await db()`SELECT max_mark FROM assignments WHERE id = ${aid}`)[0];
  if (mark !== null && (isNaN(mark) || mark < 0 || mark > Number(a.max_mark))) return { error: `Mark must be 0–${Number(a.max_mark)}` };
  if (ret && mark === null) return { error: "Enter a mark before returning." };
  // Allows marking students who submitted on paper (no online submission) too.
  await db()`
    INSERT INTO submissions(assignment_id, student_id, file_name, mark, feedback, status, returned_at)
    VALUES (${aid}, ${sid}, 'Paper / in class', ${mark}, ${feedback}, ${ret ? "returned" : "submitted"}, ${ret ? new Date().toISOString() : null})
    ON CONFLICT (assignment_id, student_id) DO UPDATE SET
      mark = EXCLUDED.mark, feedback = EXCLUDED.feedback,
      status = CASE WHEN ${ret} THEN 'returned' ELSE submissions.status END,
      returned_at = CASE WHEN ${ret} THEN now() ELSE submissions.returned_at END`;
  revalidatePath(`/admin/assignments/${aid}`);
  return { ok: ret ? "Returned" : "Saved", at: Date.now() };
}
export async function returnAllMarked(fd: FormData) {
  await requireAdmin();
  const aid = num(fd, "id");
  await db()`UPDATE submissions SET status='returned', returned_at=now() WHERE assignment_id=${aid} AND mark IS NOT NULL AND status <> 'returned'`;
  revalidatePath(`/admin/assignments/${aid}`);
}
export async function unreturn(fd: FormData) {
  await requireAdmin();
  await db()`UPDATE submissions SET status='submitted', returned_at=NULL WHERE id=${num(fd, "id")}`;
  revalidatePath(`/admin/assignments/${num(fd, "assignment_id")}`);
}

/* ---------- Students ---------- */
export async function saveStudent(_: any, fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const up = (k: string) => str(fd, k)?.toUpperCase() ?? null;
  const v = {
    matric: up("matric"), name: up("full_name"), nick: up("nickname"), cls: up("class_code"), sys: up("system"),
    am: up("spm_addmath"), m: up("spm_math"), d1: up("dm015"), d2: up("dm025"),
    email: str(fd, "email"), phone: str(fd, "phone"), notes: str(fd, "notes"),
  };
  if (!v.matric || !v.name) return { error: "Matric and full name are required." };
  if (v.cls) await db()`INSERT INTO classes(code, semester_id) VALUES (${v.cls}, (SELECT id FROM semesters WHERE is_current LIMIT 1)) ON CONFLICT DO NOTHING`;
  try {
    if (id) {
      await db()`UPDATE students SET matric=${v.matric}, full_name=${v.name}, nickname=${v.nick}, class_code=${v.cls}, system=${v.sys},
        spm_addmath=${v.am}, spm_math=${v.m}, dm015=${v.d1}, dm025=${v.d2}, email=${v.email}, phone=${v.phone}, notes=${v.notes} WHERE id=${id}`;
    } else {
      const r = await db()`INSERT INTO students(matric, full_name, nickname, class_code, system, spm_addmath, spm_math, dm015, dm025, email, phone, notes)
        VALUES (${v.matric}, ${v.name}, ${v.nick}, ${v.cls}, ${v.sys}, ${v.am}, ${v.m}, ${v.d1}, ${v.d2}, ${v.email}, ${v.phone}, ${v.notes}) RETURNING id`;
      revalidatePath("/admin/students");
      redirect(`/admin/students/${r[0].id}`);
    }
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
    return { error: e.message?.includes("unique") ? "That matric number already exists." : e.message };
  }
  revalidatePath(`/admin/students/${id}`);
  return { ok: "Saved", at: Date.now() };
}
export async function resetPin(fd: FormData) {
  await requireAdmin();
  await db()`UPDATE students SET pin_hash = NULL WHERE id = ${num(fd, "id")}`;
  revalidatePath(`/admin/students/${num(fd, "id")}`);
}
export async function toggleActive(fd: FormData) {
  await requireAdmin();
  await db()`UPDATE students SET active = NOT active WHERE id = ${num(fd, "id")}`;
  revalidatePath(`/admin/students/${num(fd, "id")}`);
}
export async function deleteStudent(fd: FormData) {
  await requireAdmin();
  await db()`DELETE FROM students WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

/* ---------- Resources ---------- */
export async function saveResource(_: any, fd: FormData) {
  await requireAdmin();
  const title = str(fd, "title");
  let url: string | null;
  try {
    url = await fileOrUrl(fd, "res", "Resources");
  } catch (e: any) {
    return { error: e.message };
  }
  if (!title || !url) return { error: "Title and a file or link are required." };
  await db()`INSERT INTO resources(title, url, category, class_code) VALUES (${title}, ${url}, ${str(fd, "category") || "Notes"}, ${str(fd, "class_code")})`;
  revalidatePath("/admin/resources");
  return { ok: "Added", at: Date.now() };
}
export async function deleteResource(fd: FormData) {
  await requireAdmin();
  await db()`DELETE FROM resources WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/resources");
}

/* ---------- Settings ---------- */
export async function disconnectDrive() {
  await requireAdmin();
  await setSetting("google_refresh_token", null);
  revalidatePath("/admin/settings");
}
export async function saveSemester(fd: FormData) {
  await requireAdmin();
  const sd = str(fd, "start_date"), ed = str(fd, "end_date");
  await db()`UPDATE semesters SET start_date=${sd}, end_date=${ed} WHERE is_current`;
  revalidatePath("/admin/settings");
}

/* ---------- Import students from CSV (same columns as the semester sheet) ---------- */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export async function importStudents(_: any, fd: FormData) {
  await requireAdmin();
  const f = fd.get("csv") as File | null;
  const text = f && f.size ? await f.text() : String(fd.get("csv_text") || "");
  const rows = parseCSV(text.trim()).filter((r) => r.some((x) => x.trim()));
  if (rows.length < 2) return { error: "No rows found." };
  const head = rows[0].map((h) => h.replace(/\s+/g, " ").trim().toUpperCase());
  const idx = (re: RegExp) => head.findIndex((h) => re.test(h));
  const c = {
    cls: idx(/^KELAS|^CLASS/), name: idx(/^NAMA|^FULL ?NAME|^NAME/), matric: idx(/MATRI/), nick: idx(/NICK/), sys: idx(/SISTEM|SYSTEM/),
    am: idx(/ADD ?MATH/), m: idx(/^SPM ?MATH/), d1: idx(/DM015/), d2: idx(/DM025/),
  };
  if (c.matric < 0 || c.name < 0) return { error: "CSV needs at least NO MATRIK and NAMA PENUH columns." };
  const g = (r: string[], i: number) => (i < 0 ? null : (r[i] || "").trim().toUpperCase() || null);
  const data = rows.slice(1).filter((r) => g(r, c.matric));
  const classes = [...new Set(data.map((r) => g(r, c.cls)).filter(Boolean))] as string[];
  if (classes.length)
    await db()`INSERT INTO classes(code, semester_id) SELECT x, (SELECT id FROM semesters WHERE is_current LIMIT 1) FROM unnest(${classes}::text[]) x ON CONFLICT DO NOTHING`;
  const col = (i: number) => data.map((r) => g(r, i));
  const res = await db()`
    INSERT INTO students(matric, full_name, nickname, class_code, system, spm_addmath, spm_math, dm015, dm025)
    SELECT * FROM unnest(${col(c.matric)}::text[], ${col(c.name)}::text[], ${col(c.nick)}::text[], ${col(c.cls)}::text[],
      ${col(c.sys)}::text[], ${col(c.am)}::text[], ${col(c.m)}::text[], ${col(c.d1)}::text[], ${col(c.d2)}::text[])
    ON CONFLICT (matric) DO UPDATE SET full_name=EXCLUDED.full_name, nickname=EXCLUDED.nickname, class_code=EXCLUDED.class_code,
      system=EXCLUDED.system, spm_addmath=EXCLUDED.spm_addmath, spm_math=EXCLUDED.spm_math, dm015=EXCLUDED.dm015, dm025=EXCLUDED.dm025
    RETURNING (xmax = 0) AS inserted`;
  const added = res.filter((r) => r.inserted).length;
  revalidatePath("/admin/students");
  return { ok: `Imported ${res.length} rows · ${added} new, ${res.length - added} updated.`, at: Date.now() };
}

export async function saveSubmissionFolder(fd: FormData) {
  await requireAdmin();
  const v = str(fd, "folder");
  await setSetting("submission_folder_id", v ? folderIdFrom(v) : null);
  revalidatePath("/admin/settings");
}

/* ---------- Info requests ---------- */
export async function saveInfoRequest(_: any, fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Give the request a title." };
  let fields: any[];
  try { fields = JSON.parse(String(fd.get("fields") || "[]")); } catch { return { error: "Invalid fields." }; }
  fields = fields
    .map((f) => ({ id: String(f.id), label: String(f.label || "").trim(), type: f.type, required: !!f.required,
      ...(f.type === "choice" ? { options: (f.options || []).map((o: string) => o.trim()).filter(Boolean) } : {}) }))
    .filter((f) => f.label);
  if (!fields.length) return { error: "Add at least one question." };
  if (fields.some((f) => f.type === "choice" && f.options.length < 2)) return { error: "Multiple-choice questions need at least two options." };
  const classes = fd.getAll("target_classes").map(String).filter(Boolean);
  const studs = fd.getAll("target_students").map(Number).filter(Boolean);
  const due = fromLocalInput(str(fd, "due_at"));
  const open = fd.get("open") !== "off";
  const desc = str(fd, "description");
  let rid = id;
  if (id) {
    await db()`UPDATE info_requests SET title=${title}, description=${desc}, fields=${JSON.stringify(fields)}::jsonb,
      target_classes=${classes}, target_students=${studs}, due_at=${due}, open=${open} WHERE id=${id}`;
  } else {
    const r = await db()`INSERT INTO info_requests(title, description, fields, target_classes, target_students, due_at, open)
      VALUES (${title}, ${desc}, ${JSON.stringify(fields)}::jsonb, ${classes}, ${studs}, ${due}, ${open}) RETURNING id`;
    rid = r[0].id;
  }
  revalidatePath("/admin/info");
  redirect(`/admin/info/${rid}`);
}
export async function toggleInfoOpen(fd: FormData) {
  await requireAdmin();
  await db()`UPDATE info_requests SET open = NOT open WHERE id = ${num(fd, "id")}`;
  revalidatePath(`/admin/info/${num(fd, "id")}`);
}
export async function deleteInfoRequest(fd: FormData) {
  await requireAdmin();
  await db()`DELETE FROM info_requests WHERE id = ${num(fd, "id")}`;
  revalidatePath("/admin/info");
  redirect("/admin/info");
}
