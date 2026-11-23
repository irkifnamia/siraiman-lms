import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadFromDrive, saveMarkedCopy } from "@/lib/drive";
import { buildMarkedPdf } from "@/lib/merge";
import { isAnnotations } from "@/lib/ink";

export const maxDuration = 60;

/**
 * POST { annotations, mark, feedback, action: "draft" | "return" }
 * draft  → saves ink + mark/feedback (student sees nothing)
 * return → also builds <name>_marked.pdf in Drive and returns the work to the student
 */
export async function POST(req: Request, { params }: { params: Promise<{ subId: string }> }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { subId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || !isAnnotations(body.annotations)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const sub = (await db()`
    SELECT sb.*, a.max_mark::float AS max_mark, st.matric, st.nickname
    FROM submissions sb JOIN assignments a ON a.id = sb.assignment_id JOIN students st ON st.id = sb.student_id
    WHERE sb.id = ${Number(subId)}`)[0];
  if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const mark = body.mark === "" || body.mark == null ? null : Number(body.mark);
  if (mark !== null && (!Number.isFinite(mark) || mark < 0 || mark > sub.max_mark))
    return NextResponse.json({ error: `Mark must be between 0 and ${sub.max_mark}` }, { status: 400 });
  const feedback = (body.feedback ?? "").toString().trim() || null;
  const ann = body.annotations;

  if (body.action !== "return") {
    await db()`UPDATE submissions SET annotations = ${JSON.stringify(ann)}::jsonb, mark = ${mark}, feedback = ${feedback} WHERE id = ${sub.id}`;
    return NextResponse.json({ ok: true, saved: Date.now() });
  }

  if (mark === null) return NextResponse.json({ error: "Enter a mark before returning." }, { status: 400 });
  let markedRef: string | null = sub.marked_file_url;
  try {
    if (sub.file_url?.startsWith("drive:") && ann.items.length) {
      const src = await downloadFromDrive(sub.file_url.slice(6));
      const pdf = await buildMarkedPdf(src.bytes, src.mime, ann);
      const base = src.name.replace(/\.[^.]+$/, "");
      const id = await saveMarkedCopy(pdf, `${base}_marked.pdf`, src.parents[0], sub.marked_file_url?.slice(6));
      markedRef = `drive:${id}`;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not build the marked copy" }, { status: 500 });
  }
  await db()`UPDATE submissions SET annotations = ${JSON.stringify(ann)}::jsonb, mark = ${mark}, feedback = ${feedback},
    marked_file_url = ${markedRef}, status = 'returned', returned_at = now() WHERE id = ${sub.id}`;
  revalidatePath(`/admin/assignments/${sub.assignment_id}`);
  return NextResponse.json({ ok: true, returned: true, marked: markedRef });
}
