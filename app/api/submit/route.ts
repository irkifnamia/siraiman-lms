import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitWork } from "@/lib/submit";

export const maxDuration = 60;

/** Plain multipart endpoint for uploads: lets the phone see real HTTP errors instead of hanging. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "student" || !s.sid) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  let fd: FormData;
  try { fd = await req.formData(); } catch { return NextResponse.json({ error: "The upload was cut off. Please try again." }, { status: 400 }); }
  try {
    const r = await submitWork({ sid: s.sid, cls: s.cls }, fd);
    return NextResponse.json(r, { status: r.error ? 400 : 200 });
  } catch (e) {
    console.error("api/submit failed", e);
    return NextResponse.json({ error: "Upload failed on the server. Please try again in a minute." }, { status: 500 });
  }
}
