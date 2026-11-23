import { getSetting, setSetting } from "./db";

/**
 * Google Drive integration (OAuth, full drive scope so files can go into folders the lecturer created).
 * The lecturer connects once in Admin → Settings; the refresh token is stored in Neon.
 * Uploaded files stay private in the lecturer's Drive and are streamed through /api/files/[id].
 */
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
export const MAX_UPLOAD = 4 * 1024 * 1024; // Vercel function body limit ~4.5MB

export function driveConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function redirectUri() {
  return `${appUrl()}/api/google/callback`;
}

export async function driveConnected() {
  if (!driveConfigured()) return false;
  return !!(await getSetting("google_refresh_token"));
}

export async function exchangeCode(code: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.error || "Token exchange failed");
  if (j.refresh_token) await setSetting("google_refresh_token", j.refresh_token);
  return j;
}

let cached: { token: string; exp: number } | null = null;

async function accessToken() {
  if (cached && cached.exp > Date.now() + 60000) return cached.token;
  const refresh = await getSetting("google_refresh_token");
  if (!refresh) throw new Error("Google Drive is not connected");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refresh,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || "Drive token refresh failed");
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cached.token;
}

async function findOrCreateFolder(name: string, parent?: string) {
  const tok = await accessToken();
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parent ? `'${parent}' in parents` : null,
  ].filter(Boolean).join(" and ");
  const s = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${tok}` } }
  ).then((r) => r.json());
  if (s.files?.[0]?.id) return s.files[0].id as string;
  const c = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parent ? { parents: [parent] } : {}),
    }),
  }).then((r) => r.json());
  if (!c.id) throw new Error("Could not create Drive folder");
  return c.id as string;
}

export function folderIdFrom(input: string) {
  const m = input.match(/folders\/([\w-]{10,})/) || input.match(/[?&]id=([\w-]{10,})/) || input.match(/^([\w-]{10,})$/);
  return m ? m[1] : null;
}

/** Lecturer uploads (attachments, resources) go into "LMS Uploads" inside the semester folder. */
async function rootFolder() {
  let id = await getSetting("drive_root_id");
  if (!id) {
    const sem = await getSetting("drive_folder_id");
    id = await findOrCreateFolder("LMS Uploads", sem || undefined);
    await setSetting("drive_root_id", id);
  }
  return id;
}

/** Student work: <submission folder>/<CLASS>/<task>/<file>. Falls back to the uploads folder. */
export async function uploadSubmission(file: File, name: string, cls: string, taskFolder: string) {
  const sub = await getSetting("submission_folder_id");
  const base = sub ? await findOrCreateFolder(cls || "OTHER", sub) : await findOrCreateFolder("Submissions", await rootFolder());
  const folder = await findOrCreateFolder(taskFolder, base);
  return uploadInto(file, name, folder);
}

/** Upload a file into <root>/<subfolder>. Returns Drive file id. */
export async function uploadToDrive(file: File, name: string, subfolder: string) {
  return uploadInto(file, name, await findOrCreateFolder(subfolder, await rootFolder()));
}

async function uploadInto(file: File, name: string, parent: string) {
  if (file.size > MAX_UPLOAD) throw new Error("File is larger than 4 MB");
  const tok = await accessToken();
  const meta = { name, parents: [parent] };
  const boundary = "lms" + Math.random().toString(36).slice(2);
  const buf = Buffer.from(await file.arrayBuffer());
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
        `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`
    ),
    buf,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const r = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "Drive upload failed");
  return j.id as string;
}

export async function streamFromDrive(id: string) {
  const tok = await accessToken();
  const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=name,mimeType`, {
    headers: { Authorization: `Bearer ${tok}` },
  }).then((r) => r.json());
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
  return { res: r, name: meta.name as string, type: (meta.mimeType as string) || "application/octet-stream" };
}

/** Normalise a stored file reference to a URL usable in the UI. */
export function fileHref(ref?: string | null) {
  if (!ref) return null;
  if (ref.startsWith("drive:")) return `/api/files/${ref.slice(6)}`;
  return ref;
}
