/** Small descriptive-statistics + ranking helpers used by Analysis and student Marks. */

export function describe(xs: number[]) {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return null;
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const q = (p: number) => {
    const i = (n - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return v[lo] + (v[hi] - v[lo]) * (i - lo);
  };
  const sd = n > 1 ? Math.sqrt(v.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1)) : 0;
  return { n, mean, median: q(0.5), q1: q(0.25), q3: q(0.75), min: v[0], max: v[n - 1], sd };
}

/** Standard competition ranking (1, 2, 2, 4) on `score`, highest first. */
export function rank<T extends { score: number }>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  let last = NaN, lastRank = 0;
  return sorted.map((r, i) => {
    const rk = r.score === last ? lastRank : i + 1;
    last = r.score; lastRank = rk;
    return { ...r, rank: rk };
  });
}

/** Malaysian matriculation-style grade bands on a percentage. */
export const BANDS = [
  { g: "A", min: 80 }, { g: "A-", min: 75 }, { g: "B+", min: 70 }, { g: "B", min: 65 }, { g: "B-", min: 60 },
  { g: "C+", min: 55 }, { g: "C", min: 50 }, { g: "C-", min: 45 }, { g: "D+", min: 40 }, { g: "D", min: 35 }, { g: "F", min: 0 },
];
export const gradeOf = (p: number) => BANDS.find((b) => p >= b.min)!.g;

export const r1 = (x: number | null | undefined) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10) / 10);
