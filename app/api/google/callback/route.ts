import { NextResponse, type NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { exchangeCode } from "@/lib/drive";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!(await isAdmin(s))) return new NextResponse("Forbidden", { status: 403 });
  const code = req.nextUrl.searchParams.get("code");
  const back = new URL("/admin/settings", req.url);
  try {
    if (!code) throw new Error(req.nextUrl.searchParams.get("error") || "No code returned");
    await exchangeCode(code);
    back.searchParams.set("drive", "ok");
  } catch (e: any) {
    back.searchParams.set("err", e.message);
  }
  return NextResponse.redirect(back);
}
