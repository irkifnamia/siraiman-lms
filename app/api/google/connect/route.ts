import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { DRIVE_SCOPE, redirectUri } from "@/lib/drive";

export async function GET() {
  const s = await getSession();
  if (!(await isAdmin(s))) return new NextResponse("Forbidden", { status: 403 });
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri(), response_type: "code",
    scope: DRIVE_SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "true",
  }).toString();
  return NextResponse.redirect(u);
}
