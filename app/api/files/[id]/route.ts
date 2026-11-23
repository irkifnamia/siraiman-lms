import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamFromDrive } from "@/lib/drive";

/** Streams a private Drive file to the lecturer, or to the student who owns it / class it's shared with. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });
  const ref = `drive:${id}`;
  if (s.role !== "admin") {
    const ok = await db()`
      SELECT 1 FROM submissions WHERE file_url = ${ref} AND student_id = ${s.sid}
      UNION ALL SELECT 1 FROM assignments WHERE attachment_url = ${ref} AND published AND (class_code IS NULL OR class_code = ${s.cls})
      UNION ALL SELECT 1 FROM resources WHERE url = ${ref} AND (class_code IS NULL OR class_code = ${s.cls})
      LIMIT 1`;
    if (!ok.length) return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const { res, name, type } = await streamFromDrive(id);
    if (!res.ok) return new NextResponse("File not found", { status: res.status });
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name || "file")}`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 500 });
  }
}
