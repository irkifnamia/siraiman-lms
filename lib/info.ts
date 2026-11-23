import { db } from "./db";

import type { Field } from "./infoTypes";
export * from "./infoTypes";

/** SQL condition: is student (sid, cls) a target of request r? Everyone when no targets are set. */
export async function requestsForStudent(sid: number, cls: string) {
  return db()`
    SELECT r.*, resp.updated_at AS answered_at, resp.answers
    FROM info_requests r
    LEFT JOIN info_responses resp ON resp.request_id = r.id AND resp.student_id = ${sid}
    WHERE (coalesce(cardinality(r.target_classes), 0) = 0 AND coalesce(cardinality(r.target_students), 0) = 0)
       OR ${cls} = ANY(r.target_classes) OR ${sid} = ANY(r.target_students)
    ORDER BY (resp.id IS NULL AND r.open) DESC, r.due_at NULLS LAST, r.created_at DESC`;
}

export async function targetsOf(r: any) {
  return db()`
    SELECT s.id, s.nickname, s.full_name, s.matric, s.class_code FROM students s
    WHERE s.active AND (
      (coalesce(cardinality(${r.target_classes}::text[]), 0) = 0 AND coalesce(cardinality(${r.target_students}::int[]), 0) = 0)
      OR s.class_code = ANY(${r.target_classes}::text[]) OR s.id = ANY(${r.target_students}::int[]))
    ORDER BY s.class_code, s.nickname`;
}

export function validateAnswers(fields: Field[], raw: Record<string, any>) {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = String(raw[f.id] ?? "").trim().slice(0, 2000);
    if (!v) { if (f.required) return { error: `“${f.label}” is required.` }; continue; }
    if (f.type === "number" && !/^-?\d+(\.\d+)?$/.test(v)) return { error: `“${f.label}” must be a number.` };
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: `“${f.label}” must be a valid email.` };
    if (f.type === "phone" && !/^[+\d][\d\s-]{6,}$/.test(v)) return { error: `“${f.label}” must be a valid phone number.` };
    if (f.type === "date" && isNaN(Date.parse(v))) return { error: `“${f.label}” must be a date.` };
    if (f.type === "choice" && f.options && !f.options.includes(v)) return { error: `Choose an option for “${f.label}”.` };
    if (f.type === "yesno" && !["Yes", "No"].includes(v)) return { error: `Answer Yes or No for “${f.label}”.` };
    out[f.id] = v;
  }
  return { answers: out };
}
