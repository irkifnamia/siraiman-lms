"use client";
import { useRouter, useSearchParams } from "next/navigation";

/** A <select> that updates one query-string key on change. */
export function AutoSelect({ name, value, options, className = "input" }: {
  name: string; value: string; options: [string, string][]; className?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select className={className} value={value} onChange={(e) => {
      const q = new URLSearchParams(sp.toString());
      e.target.value ? q.set(name, e.target.value) : q.delete(name);
      router.push("?" + q.toString());
    }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
