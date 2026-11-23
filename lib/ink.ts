/**
 * Annotation format shared by the tablet marker (client) and the PDF merger (server).
 * All coordinates are normalised to the page AS DISPLAYED (rotation applied):
 * x = 0..1 across, y = 0..1 down. Sizes are fractions of the displayed page width.
 */
export type InkItem = { k: "ink"; page: number; color: string; w: number; op?: number; pts: number[] };
export type TextItem = { k: "text"; page: number; x: number; y: number; size: number; color: string; text: string };
export type Item = InkItem | TextItem;
export type Annotations = { v: 1; items: Item[] };

export const COLORS = { red: "#e11d48", blue: "#2563eb", green: "#059669", black: "#111827" } as const;
export const HIGHLIGHT = "#facc15";

/** Tick / cross / circle stamps as polylines centred on (x, y), size s (fraction of width), page aspect a = h/w. */
export function stampPoints(kind: "tick" | "cross" | "circle", x: number, y: number, s: number, a: number): number[][] {
  const sx = s, sy = s / a; // keep shapes square on the page
  if (kind === "tick") return [[x - 0.5 * sx, y, x - 0.15 * sx, y + 0.4 * sy, x + 0.55 * sx, y - 0.5 * sy]];
  if (kind === "cross")
    return [
      [x - 0.45 * sx, y - 0.45 * sy, x + 0.45 * sx, y + 0.45 * sy],
      [x + 0.45 * sx, y - 0.45 * sy, x - 0.45 * sx, y + 0.45 * sy],
    ];
  const pts: number[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = (i / 32) * Math.PI * 2;
    pts.push(x + Math.cos(t) * 0.55 * sx, y + Math.sin(t) * 0.55 * sy);
  }
  return [pts];
}

export function isAnnotations(a: any): a is Annotations {
  return a && a.v === 1 && Array.isArray(a.items);
}
