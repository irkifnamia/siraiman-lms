import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/session";

export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(COOKIE);
  return res;
}
