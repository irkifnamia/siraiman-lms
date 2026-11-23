import { db } from "./db";

export async function studentById(id: number) {
  const r = await db()`SELECT * FROM students WHERE id = ${id}`;
  return r[0];
}

/** Assignments visible to a class, with the student's submission joined. */
export async function tasksForStudent(sid: number, cls: string) {
  return db()`
    SELECT a.*, s.id AS sub_id, s.status AS sub_status, s.submitted_at, s.mark, s.feedback, s.returned_at
    FROM assignments a
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ${sid}
      AND (s.file_url IS NOT NULL OR s.status = 'returned')
    WHERE a.published AND (a.class_code IS NULL OR a.class_code = ${cls})
    ORDER BY a.due_at NULLS LAST, a.id DESC`;
}

export async function announcementsFor(cls: string | null, limit = 50) {
  if (cls === null) return db()`SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC LIMIT ${limit}`;
  return db()`SELECT * FROM announcements WHERE class_code IS NULL OR class_code = ${cls}
              ORDER BY pinned DESC, created_at DESC LIMIT ${limit}`;
}

export async function planAll() {
  return db()`SELECT * FROM learning_plan ORDER BY week, id`;
}

export async function resourcesFor(cls: string | null) {
  if (cls === null) return db()`SELECT * FROM resources ORDER BY category, created_at DESC`;
  return db()`SELECT * FROM resources WHERE class_code IS NULL OR class_code = ${cls} ORDER BY category, created_at DESC`;
}

export async function attendanceSummary(sid: number) {
  const r = await db()`SELECT status, count(*)::int n FROM attendance WHERE student_id = ${sid} GROUP BY status`;
  const m: Record<string, number> = { P: 0, A: 0, L: 0, E: 0 };
  r.forEach((x) => (m[x.status] = x.n));
  const total = m.P + m.A + m.L + m.E;
  return { P: m.P, A: m.A, L: m.L, E: m.E, total, rate: total ? Math.round(((m.P + m.L) / total) * 100) : null };
}
