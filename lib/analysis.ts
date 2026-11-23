import { db } from "./db";
import { rank } from "./stats";

export type Scope = { cls?: string | null; task?: number | null; returnedOnly?: boolean };

/** All marked submissions (optionally only returned), with student + task info. */
export async function markedRows(returnedOnly = false) {
  return db()`
    SELECT sb.student_id, sb.assignment_id, sb.mark::float AS mark, a.max_mark::float AS max_mark,
           100.0 * sb.mark / a.max_mark AS pct, a.title, a.kind, a.class_code AS task_class,
           st.nickname, st.full_name, st.matric, st.class_code
    FROM submissions sb
    JOIN assignments a ON a.id = sb.assignment_id
    JOIN students st ON st.id = sb.student_id
    WHERE sb.mark IS NOT NULL AND st.active AND (${!returnedOnly} OR sb.status = 'returned')`;
}

/** Leaderboard rows for a scope: per-task % or overall average % across marked tasks. */
export function leaderboard(rows: any[], { cls, task }: Scope) {
  const r = rows.filter((x) => (!cls || x.class_code === cls) && (!task || x.assignment_id === task));
  const by = new Map<number, any>();
  for (const x of r) {
    const e = by.get(x.student_id) || { student_id: x.student_id, nickname: x.nickname, full_name: x.full_name, matric: x.matric, class_code: x.class_code, pcts: [] as number[], mark: x.mark, max: x.max_mark };
    e.pcts.push(Number(x.pct));
    by.set(x.student_id, e);
  }
  return rank([...by.values()].map((e) => ({ ...e, n: e.pcts.length, score: e.pcts.reduce((a: number, b: number) => a + b, 0) / e.pcts.length })));
}
