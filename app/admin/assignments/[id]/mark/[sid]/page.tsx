import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Marker } from "@/components/Marker";

export default async function MarkPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const aid = Number(id), stid = Number(sid);
  const [ar, list] = await Promise.all([
    db()`SELECT id, title, max_mark::float AS max_mark FROM assignments WHERE id = ${aid}`,
    db()`SELECT st.id, st.nickname, st.matric, st.class_code, sb.id AS sub_id, sb.file_url, sb.file_name, sb.mark::float AS mark,
                sb.feedback, sb.status, sb.annotations, sb.note
         FROM submissions sb JOIN students st ON st.id = sb.student_id
         WHERE sb.assignment_id = ${aid} AND sb.file_url IS NOT NULL AND st.active
         ORDER BY st.class_code, st.nickname`,
  ]);
  const a = ar[0];
  const i = list.findIndex((r) => r.id === stid);
  if (!a || i < 0) notFound();
  const r = list[i];
  const href = (k: number) => (list[k] ? `/admin/assignments/${aid}/mark/${list[k].id}` : null);
  return (
    <Marker
      key={r.sub_id}
      sub={{ id: r.sub_id, file_url: r.file_url, file_name: r.file_name, mark: r.mark, feedback: r.feedback, status: r.status, annotations: r.annotations, note: r.note }}
      student={{ nickname: r.nickname, matric: r.matric, class_code: r.class_code }}
      task={{ id: a.id, title: a.title, max_mark: a.max_mark }}
      prevHref={href(i - 1)} nextHref={href(i + 1)} backHref={`/admin/assignments/${aid}`} pos={`${i + 1} of ${list.length}`}
    />
  );
}
