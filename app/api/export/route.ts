import { NextResponse, type NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaderboard, markedRows } from "@/lib/analysis";
import { gradeOf, r1 } from "@/lib/stats";

const esc = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: any[][]) => "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!(await isAdmin(s))) return new NextResponse("Forbidden", { status: 403 });
  const p = req.nextUrl.searchParams;
  const type = p.get("type");
  const cls = p.get("class") || "";
  let out: any[][] = [];
  let name = "export";

  if (type === "students") {
    const r = await db()`SELECT * FROM students WHERE (${cls} = '' OR class_code = ${cls}) ORDER BY class_code, full_name`;
    out = [["KELAS", "NAMA PENUH", "NO MATRIK", "NICKNAME", "SISTEM", "SPM ADDMATH", "SPM MATH", "DM015", "DM025", "EMAIL", "PHONE", "ACTIVE"],
      ...r.map((x) => [x.class_code, x.full_name, x.matric, x.nickname, x.system, x.spm_addmath, x.spm_math, x.dm015, x.dm025, x.email, x.phone, x.active])];
    name = `students${cls ? "_" + cls : ""}`;
  } else if (type === "task") {
    const id = Number(p.get("id"));
    const a = (await db()`SELECT * FROM assignments WHERE id = ${id}`)[0];
    const r = await db()`SELECT st.class_code, st.matric, st.nickname, st.full_name, sb.submitted_at, sb.mark, sb.status, sb.feedback
      FROM students st LEFT JOIN submissions sb ON sb.student_id = st.id AND sb.assignment_id = ${id}
      WHERE st.active AND (${a.class_code}::text IS NULL OR st.class_code = ${a.class_code}) ORDER BY st.class_code, st.nickname`;
    out = [["KELAS", "NO MATRIK", "NICKNAME", "NAMA", "SUBMITTED", `MARK /${Number(a.max_mark)}`, "STATUS", "FEEDBACK"],
      ...r.map((x) => [x.class_code, x.matric, x.nickname, x.full_name, x.submitted_at?.toISOString?.() ?? "", x.mark, x.status ?? "missing", x.feedback])];
    name = `task_${id}`;
  } else if (type === "gradebook") {
    const tasks = await db()`SELECT id, title, max_mark FROM assignments WHERE class_code IS NULL OR class_code = ${cls} ORDER BY due_at NULLS LAST, id`;
    const st = await db()`SELECT id, matric, nickname, full_name FROM students WHERE active AND class_code = ${cls} ORDER BY nickname`;
    const sub = await db()`SELECT sb.student_id, sb.assignment_id, sb.mark FROM submissions sb JOIN students s ON s.id = sb.student_id WHERE s.class_code = ${cls}`;
    const m = new Map(sub.map((x) => [`${x.student_id}:${x.assignment_id}`, x.mark]));
    out = [["NO MATRIK", "NICKNAME", "NAMA", ...tasks.map((t) => `${t.title} (/${Number(t.max_mark)})`)],
      ...st.map((x) => [x.matric, x.nickname, x.full_name, ...tasks.map((t) => m.get(`${x.id}:${t.id}`) ?? "")])];
    name = `gradebook_${cls}`;
  } else if (type === "leaderboard") {
    const task = p.get("task") ? Number(p.get("task")) : null;
    const lb = leaderboard(await markedRows(p.get("ret") === "1"), { cls, task });
    out = [["RANK", "NO MATRIK", "NICKNAME", "NAMA", "KELAS", task ? "MARK" : "TASKS COUNTED", "PERCENT", "GRADE"],
      ...lb.map((b) => [b.rank, b.matric, b.nickname, b.full_name, b.class_code, task ? `${b.mark}/${b.max}` : b.n, r1(b.score), gradeOf(b.score)])];
    name = `leaderboard_${cls || "all"}${task ? "_task" + task : ""}`;
  } else if (type === "info") {
    const { targetsOf } = await import("@/lib/info");
    const r = (await db()`SELECT * FROM info_requests WHERE id = ${Number(p.get("id"))}`)[0];
    if (!r) return new NextResponse("Not found", { status: 404 });
    const [targets, resps] = await Promise.all([targetsOf(r), db()`SELECT * FROM info_responses WHERE request_id = ${r.id}`]);
    const by = new Map(resps.map((x) => [x.student_id, x]));
    out = [["KELAS", "NO MATRIK", "NICKNAME", "NAMA", ...r.fields.map((f: any) => f.label), "UPDATED"],
      ...targets.map((t) => { const a = by.get(t.id); return [t.class_code, t.matric, t.nickname, t.full_name, ...r.fields.map((f: any) => a?.answers?.[f.id] ?? ""), a ? new Date(a.updated_at).toISOString() : "not answered"]; })];
    name = `info_${r.id}_${r.title.replace(/[^\w]+/g, "_").slice(0, 30)}`;
  } else return new NextResponse("Unknown export", { status: 400 });

  return new NextResponse(csv(out), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` },
  });
}
