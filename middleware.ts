import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "./lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifySession(req.cookies.get(COOKIE)?.value);

  if (pathname.startsWith("/login")) {
    if (s) return NextResponse.redirect(new URL(s.role === "admin" ? "/admin" : "/", req.url));
    return NextResponse.next();
  }
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/admin") && s.role !== "admin")
    return NextResponse.redirect(new URL("/", req.url));
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && s.role === "admin")
    return NextResponse.redirect(new URL("/admin", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon|icon|manifest|apple-icon|.*\\.(?:png|svg|ico|webmanifest)).*)"],
};
