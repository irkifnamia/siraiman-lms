import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function db() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export async function getSetting(key: string): Promise<string | null> {
  const r = await db()`SELECT value FROM settings WHERE key = ${key}`;
  return (r[0]?.value as string) ?? null;
}

export async function setSetting(key: string, value: string | null) {
  await db()`INSERT INTO settings(key, value) VALUES (${key}, ${value})
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

export async function getClasses(): Promise<string[]> {
  const r = await db()`SELECT code FROM classes ORDER BY code`;
  return r.map((x) => x.code as string);
}

export async function currentSemester(): Promise<string> {
  const r = await db()`SELECT code FROM semesters WHERE is_current ORDER BY id DESC LIMIT 1`;
  return (r[0]?.code as string) ?? "";
}
