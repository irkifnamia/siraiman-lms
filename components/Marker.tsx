"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Circle, Eraser, Hand, Highlighter, Loader2, MessageSquare, Minus, PenLine,
  Plus, Redo2, Send, Type, Undo2, X, Check, ExternalLink,
} from "lucide-react";
import { COLORS, HIGHLIGHT, stampPoints, type Item } from "@/lib/ink";

type Tool = "pen" | "hl" | "eraser" | "tick" | "cross" | "circle" | "text";
const SIZES = [0.0022, 0.0038, 0.0065];
const STAMP = 0.06;

type Props = {
  sub: { id: number; file_url: string | null; file_name: string | null; mark: number | null; feedback: string | null; status: string; annotations: any; note: string | null };
  student: { nickname: string; matric: string; class_code: string };
  task: { id: number; title: string; max_mark: number };
  prevHref: string | null; nextHref: string | null; backHref: string; pos: string;
};

function drawItem(ctx: CanvasRenderingContext2D, it: Item, W: number, H: number) {
  ctx.save();
  if (it.k === "ink") {
    ctx.strokeStyle = it.color; ctx.globalAlpha = it.op ?? 1; ctx.lineWidth = Math.max(1, it.w * W);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const p = it.pts;
    ctx.beginPath(); ctx.moveTo(p[0] * W, p[1] * H);
    if (p.length === 2) ctx.lineTo(p[0] * W + 0.1, p[1] * H);
    for (let i = 2; i < p.length; i += 2) {
      if (i + 2 < p.length && p.length > 8) { // smooth handwriting; keep short stamps crisp
        const mx = ((p[i] + p[i + 2]) / 2) * W, my = ((p[i + 1] + p[i + 3]) / 2) * H;
        ctx.quadraticCurveTo(p[i] * W, p[i + 1] * H, mx, my);
      } else ctx.lineTo(p[i] * W, p[i + 1] * H);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = it.color; ctx.font = `bold ${it.size * W}px Helvetica, Arial, sans-serif`;
    ctx.fillText(it.text, it.x * W, it.y * H);
  }
  ctx.restore();
}

export function Marker({ sub, student, task, prevHref, nextHref, backHref, pos }: Props) {
  const router = useRouter();
  const driveId = sub.file_url?.startsWith("drive:") ? sub.file_url.slice(6) : null;
  const [ratios, setRatios] = useState<number[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>(() => (sub.annotations?.items as Item[]) || []);
  const [undo, setUndo] = useState<Item[][]>([]);
  const [redo, setRedo] = useState<Item[][]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(COLORS.red);
  const [size, setSize] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [finger, setFinger] = useState(false);
  const [text, setText] = useState("");
  const [mark, setMark] = useState(sub.mark === null ? "" : String(Number(sub.mark)));
  const [feedback, setFeedback] = useState(sub.feedback || "");
  const [showFb, setShowFb] = useState(!!sub.feedback);
  const [status, setStatus] = useState<{ s: "idle" | "saving" | "saved" | "error" | "returning"; msg?: string }>({ s: "idle" });
  const [width, setWidth] = useState(0);

  const scroller = useRef<HTMLDivElement>(null);
  const src = useRef<{ kind: "pdf"; doc: any } | { kind: "img"; bmp: ImageBitmap } | null>(null);
  const bg = useRef<(HTMLCanvasElement | null)[]>([]);
  const ink = useRef<(HTMLCanvasElement | null)[]>([]);
  const live = useRef<{ page: number; pts: number[]; id: number } | null>(null);
  const pan = useRef<{ id: number; x: number; y: number; l: number; t: number } | null>(null);
  const lastPen = useRef(0);
  const erasing = useRef<{ page: number; before: Item[] } | null>(null);
  const itemsRef = useRef(items); itemsRef.current = items;
  const opts = useRef({ tool, color, size, finger, text }); opts.current = { tool, color, size, finger, text };
  const dirty = useRef(false);

  /* ---------- load the submission ---------- */
  useEffect(() => {
    if (!driveId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/files/${driveId}`);
        if (!r.ok) throw new Error(`Could not open file (${r.status})`);
        const blob = await r.blob();
        if (blob.type === "application/pdf") {
          const pdfjs: any = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
          const rs: number[] = [];
          for (let i = 1; i <= doc.numPages; i++) {
            const vp = (await doc.getPage(i)).getViewport({ scale: 1 });
            rs.push(vp.height / vp.width);
          }
          if (cancelled) return;
          src.current = { kind: "pdf", doc }; setRatios(rs);
        } else if (blob.type === "image/jpeg" || blob.type === "image/png") {
          const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" } as any);
          if (cancelled) return;
          src.current = { kind: "img", bmp }; setRatios([bmp.height / bmp.width]);
        } else throw new Error("This file type can't be annotated (only PDF, JPG, PNG). Open it and enter the mark below.");
      } catch (e: any) { if (!cancelled) setLoadErr(e.message); }
    })();
    return () => { cancelled = true; };
  }, [driveId]);

  /* ---------- page width follows the screen ---------- */
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.min(el.clientWidth - 24, 1000)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const pageW = Math.round(width * zoom);

  /* ---------- render page backgrounds ---------- */
  useEffect(() => {
    if (!ratios || !pageW || !src.current) return;
    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    (async () => {
      for (let i = 0; i < ratios.length; i++) {
        const c = bg.current[i]; if (!c || cancelled) continue;
        const w = Math.round(pageW * dpr), h = Math.round(pageW * ratios[i] * dpr);
        c.width = w; c.height = h;
        const ctx = c.getContext("2d")!;
        if (src.current!.kind === "pdf") {
          const page = await src.current!.doc.getPage(i + 1);
          const vp1 = page.getViewport({ scale: 1 });
          await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: w / vp1.width }) }).promise;
        } else {
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(src.current!.bmp, 0, 0, w, h);
        }
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [ratios, pageW]);

  /* ---------- render ink ---------- */
  const paint = useCallback((page?: number) => {
    if (!ratios) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    ratios.forEach((r, i) => {
      if (page !== undefined && page !== i) return;
      const c = ink.current[i]; if (!c) return;
      const w = Math.round(pageW * dpr), h = Math.round(pageW * r * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      for (const it of itemsRef.current) if (it.page === i) drawItem(ctx, it, w, h);
    });
  }, [ratios, pageW]);
  useEffect(() => { paint(); }, [items, paint]);

  /* ---------- history ---------- */
  const commit = (next: Item[], before = itemsRef.current) => {
    setUndo((u) => [...u.slice(-60), before]); setRedo([]); setItems(next); dirty.current = true;
  };
  const doUndo = () => setUndo((u) => {
    if (!u.length) return u;
    setRedo((r) => [...r, itemsRef.current]); setItems(u[u.length - 1]); dirty.current = true;
    return u.slice(0, -1);
  });
  const doRedo = () => setRedo((r) => {
    if (!r.length) return r;
    setUndo((u) => [...u, itemsRef.current]); setItems(r[r.length - 1]); dirty.current = true;
    return r.slice(0, -1);
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  /* ---------- pointer input ---------- */
  const norm = (e: React.PointerEvent | PointerEvent, page: number) => {
    const r = ink.current[page]!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  const eraseAt = (page: number, x: number, y: number) => {
    const ratio = ratios![page], rad = 0.018;
    const hit = (it: Item) => {
      if (it.page !== page) return false;
      if (it.k === "text") { const h = it.size * 1.1, w = it.text.length * it.size * 0.6; return x >= it.x - rad && x <= it.x + w && y >= it.y - h / ratio && y <= it.y + rad; }
      const p = it.pts, lim = rad + it.w / 2;
      const d = (ax: number, ay: number, bx: number, by: number) => { // point-to-segment, y scaled to page aspect
        ay *= ratio; by *= ratio; const py = y * ratio, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (py - ay) * dy) / L)) : 0;
        return Math.hypot(x - (ax + t * dx), py - (ay + t * dy));
      };
      if (p.length === 2) return d(p[0], p[1], p[0], p[1]) < lim;
      for (let i = 0; i + 3 < p.length; i += 2) if (d(p[i], p[i + 1], p[i + 2], p[i + 3]) < lim) return true;
      return false;
    };
    const cur = itemsRef.current, keep = cur.filter((it) => !hit(it));
    if (keep.length !== cur.length) { setItems(keep); itemsRef.current = keep; dirty.current = true; }
  };

  const onDown = (e: React.PointerEvent, page: number) => {
    const o = opts.current;
    const now = performance.now();
    if (e.pointerType === "pen") lastPen.current = now;
    const draws = e.pointerType === "pen" || e.pointerType === "mouse" || (o.finger && e.pointerType === "touch");
    if (!draws) return; // finger: handled by the scroller (pans)
    e.stopPropagation();
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
    const [x, y] = norm(e, page);
    const ratio = ratios![page];
    if (o.tool === "pen" || o.tool === "hl") {
      live.current = { page, pts: [x, y], id: e.pointerId };
    } else if (o.tool === "eraser") {
      erasing.current = { page, before: itemsRef.current };
      eraseAt(page, x, y);
    } else if (o.tool === "text") {
      if (!o.text.trim()) return;
      commit([...itemsRef.current, { k: "text", page, x, y, size: 0.035, color: o.color, text: o.text.trim() }]);
    } else {
      const add = stampPoints(o.tool, x, y, STAMP, ratio).map((pts) => ({ k: "ink" as const, page, color: o.tool === "cross" ? COLORS.red : o.color, w: SIZES[2], pts }));
      commit([...itemsRef.current, ...add]);
    }
  };

  const onMove = (e: React.PointerEvent, page: number) => {
    if (e.pointerType === "pen") lastPen.current = performance.now();
    if (erasing.current) { const [x, y] = norm(e, page); eraseAt(page, x, y); return; }
    const L = live.current;
    if (!L || L.id !== e.pointerId || L.page !== page) return;
    const co = (e.nativeEvent as any).getCoalescedEvents?.() as PointerEvent[] | undefined;
    const evs = co && co.length ? co : [e.nativeEvent];
    const c = ink.current[page]!, ctx = c.getContext("2d")!;
    const o = opts.current, hl = o.tool === "hl";
    ctx.save();
    ctx.strokeStyle = hl ? HIGHLIGHT : o.color; ctx.globalAlpha = hl ? 0.35 : 1;
    ctx.lineWidth = (hl ? 0.022 : SIZES[o.size]) * c.width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const ev of evs) {
      const [x, y] = norm(ev, page);
      const px = L.pts[L.pts.length - 2], py = L.pts[L.pts.length - 1];
      if (Math.hypot(x - px, y - py) < 0.0012) continue;
      ctx.beginPath(); ctx.moveTo(px * c.width, py * c.height); ctx.lineTo(x * c.width, y * c.height); ctx.stroke();
      L.pts.push(x, y);
    }
    ctx.restore();
  };

  /* finger panning (touch-action is off so the S Pen never scrolls the page) */
  const panDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch" || opts.current.finger || !scroller.current) return;
    if (performance.now() - lastPen.current < 400) return; // palm while writing
    pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, l: scroller.current.scrollLeft, t: scroller.current.scrollTop };
  };
  const panMove = (e: React.PointerEvent) => {
    const P = pan.current;
    if (!P || P.id !== e.pointerId || !scroller.current) return;
    if (performance.now() - lastPen.current < 400) { pan.current = null; return; }
    scroller.current.scrollLeft = P.l - (e.clientX - P.x);
    scroller.current.scrollTop = P.t - (e.clientY - P.y);
  };
  const panUp = (e: React.PointerEvent) => { if (pan.current?.id === e.pointerId) pan.current = null; };

  const onUp = (e: React.PointerEvent) => {
    if (erasing.current) {
      const before = erasing.current.before; erasing.current = null;
      if (before !== itemsRef.current) { setUndo((u) => [...u.slice(-60), before]); setRedo([]); }
      return;
    }
    const L = live.current;
    if (!L || L.id !== e.pointerId) return;
    live.current = null;
    const hl = opts.current.tool === "hl";
    // round to 4 dp to keep drafts small
    const pts = L.pts.map((v) => Math.round(v * 10000) / 10000);
    commit([...itemsRef.current, hl
      ? { k: "ink", page: L.page, color: HIGHLIGHT, w: 0.022, op: 0.35, pts }
      : { k: "ink", page: L.page, color: opts.current.color, w: SIZES[opts.current.size], pts }]);
  };

  /* ---------- saving ---------- */
  const send = async (action: "draft" | "return") => {
    setStatus({ s: action === "return" ? "returning" : "saving" });
    const r = await fetch(`/api/mark/${sub.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, mark, feedback, annotations: { v: 1, items: itemsRef.current } }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : { error: "Network error — check your connection." };
    if (!r || !r.ok) { setStatus({ s: "error", msg: j.error || "Save failed" }); return false; }
    dirty.current = false;
    setStatus({ s: "saved", msg: action === "return" ? "Returned ✓" : "Draft saved" });
    return true;
  };
  // autosave drafts 2s after the last change
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => { if (dirty.current && sub.status !== "returned") send("draft"); }, 2000);
    return () => clearTimeout(t);
  }, [items, mark, feedback]); // eslint-disable-line
  const markChange = (v: string) => { setMark(v); dirty.current = true; };
  const fbChange = (v: string) => { setFeedback(v); dirty.current = true; };

  const returnAndNext = async () => {
    if (mark === "") { setStatus({ s: "error", msg: "Enter a mark first." }); return; }
    if (await send("return")) router.push(nextHref || backHref);
  };
  const go = async (href: string) => { if (dirty.current && sub.status !== "returned") await send("draft"); router.push(href); };

  /* ---------- UI ---------- */
  const tb = (on: boolean) => `size-9 shrink-0 grid place-items-center rounded-lg ${on ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`;
  const toolBtn = (t: Tool, icon: React.ReactNode, title: string) => (
    <button key={t} title={title} onClick={() => setTool(t)} className={tb(tool === t)}>{icon}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-300 select-none">
      {/* header */}
      <div className="bg-brand-700 text-white flex items-center gap-2 px-2 h-12 shrink-0">
        <button onClick={() => go(backHref)} className="size-9 grid place-items-center rounded-lg hover:bg-white/10" title="Close"><X size={18} /></button>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[13.5px] font-semibold truncate">{student.nickname} <span className="font-normal text-brand-100 text-[11.5px]">{student.matric} · {student.class_code}</span></div>
          <div className="text-[11px] text-brand-100 truncate">{task.title} · {pos}{sub.status === "returned" && " · returned"}</div>
        </div>
        <button disabled={!prevHref} onClick={() => prevHref && go(prevHref)} className="size-9 grid place-items-center rounded-lg hover:bg-white/10 disabled:opacity-30" title="Previous student"><ChevronLeft size={20} /></button>
        <button disabled={!nextHref} onClick={() => nextHref && go(nextHref)} className="size-9 grid place-items-center rounded-lg hover:bg-white/10 disabled:opacity-30" title="Next student"><ChevronRight size={20} /></button>
      </div>

      {/* toolbar */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
          {toolBtn("pen", <PenLine size={17} />, "Pen")}
          {toolBtn("hl", <Highlighter size={17} />, "Highlighter")}
          {toolBtn("eraser", <Eraser size={17} />, "Eraser (removes whole strokes)")}
          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          {toolBtn("tick", <Check size={18} strokeWidth={3} />, "Tick stamp")}
          {toolBtn("cross", <X size={18} strokeWidth={3} />, "Cross stamp")}
          {toolBtn("circle", <Circle size={17} />, "Circle stamp")}
          {toolBtn("text", <Type size={17} />, "Text")}
          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          {Object.values(COLORS).map((c) => (
            <button key={c} onClick={() => { setColor(c); if (tool === "hl" || tool === "eraser") setTool("pen"); }} title="Colour"
              className={`size-7 shrink-0 rounded-full border-2 ${color === c ? "border-slate-800 scale-110" : "border-white"}`} style={{ background: c }} />
          ))}
          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          {SIZES.map((_, i) => (
            <button key={i} onClick={() => setSize(i)} title="Pen size" className={tb(size === i && (tool === "pen"))}>
              <span className="rounded-full bg-current" style={{ width: 4 + i * 4, height: 4 + i * 4 }} />
            </button>
          ))}
          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          <button onClick={doUndo} disabled={!undo.length} className={tb(false) + " disabled:opacity-30"} title="Undo"><Undo2 size={17} /></button>
          <button onClick={doRedo} disabled={!redo.length} className={tb(false) + " disabled:opacity-30"} title="Redo"><Redo2 size={17} /></button>
          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} className={tb(false)} title="Zoom out"><Minus size={16} /></button>
          <span className="text-[11.5px] w-9 text-center tabular-nums text-slate-500 shrink-0">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className={tb(false)} title="Zoom in"><Plus size={16} /></button>
          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          <button onClick={() => setFinger(!finger)} className={tb(finger)} title={finger ? "Finger draws (tap to switch to finger scrolls)" : "Finger scrolls — only the S Pen draws"}><Hand size={17} /></button>
        </div>
        {tool === "text" && (
          <div className="flex items-center gap-2 px-3 pb-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type text (e.g. 8/10, -1 sign), then tap the page" className="input h-8" />
            {["✓ Good", "-1", "Check units", "See working"].map((q) => (
              <button key={q} onClick={() => setText(q.replace("✓ ", ""))} className="btn-outline h-8 px-2 text-[11.5px] shrink-0">{q}</button>
            ))}
          </div>
        )}
      </div>

      {/* pages */}
      <div ref={scroller} className="flex-1 overflow-auto" style={{ touchAction: "none" }}
        onPointerDown={panDown} onPointerMove={panMove} onPointerUp={panUp} onPointerCancel={panUp}>
        <div className="py-3 flex flex-col items-center gap-3" style={{ minWidth: pageW + 24 }}>
          {!driveId && (
            <div className="card max-w-md mx-3 p-4 text-[13px] text-slate-600">
              This submission is a link, so it can't be annotated here.
              {sub.file_url && <a href={sub.file_url} target="_blank" className="btn-outline mt-3"><ExternalLink size={14} /> Open the link</a>}
              <p className="mt-2 text-[12px] text-slate-400">You can still enter the mark and feedback below.</p>
            </div>
          )}
          {loadErr && <div className="card max-w-md mx-3 p-4 text-[13px] text-rose-600">{loadErr}{driveId && <a href={`/api/files/${driveId}`} target="_blank" className="btn-outline mt-3 text-slate-700"><ExternalLink size={14} /> Open the file</a>}</div>}
          {driveId && !ratios && !loadErr && <div className="py-20 text-slate-500 flex items-center gap-2 text-[13px]"><Loader2 size={16} className="animate-spin" /> Loading submission…</div>}
          {ratios?.map((r, i) => (
            <div key={i} className="relative bg-white shadow-md" style={{ width: pageW, height: pageW * r }}>
              <canvas ref={(el) => { bg.current[i] = el; }} className="absolute inset-0 w-full h-full" />
              <canvas ref={(el) => { ink.current[i] = el; }} className="absolute inset-0 w-full h-full"
                style={{ touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }}
                onPointerDown={(e) => onDown(e, i)} onPointerMove={(e) => onMove(e, i)}
                onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={(e) => { if (e.pointerType === "mouse") onUp(e); }} />
              {ratios.length > 1 && <span className="absolute -left-0 -top-0 m-1 text-[10px] bg-slate-800/60 text-white rounded px-1.5">{i + 1}/{ratios.length}</span>}
            </div>
          ))}
          {sub.note && <div className="card max-w-md mx-3 px-3 py-2 text-[12px] text-slate-600">Student note: “{sub.note}”</div>}
        </div>
      </div>

      {/* bottom bar */}
      <div className="bg-white border-t border-slate-200 shrink-0 pb-safe">
        {showFb && (
          <div className="px-3 pt-2">
            <textarea value={feedback} onChange={(e) => fbChange(e.target.value)} rows={2} placeholder="Feedback for the student…" className="input" />
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center">
            <input value={mark} onChange={(e) => markChange(e.target.value)} inputMode="decimal" placeholder="Mark"
              className="input w-20 h-10 text-right text-[15px] font-semibold tabular-nums rounded-r-none" />
            <span className="h-10 px-2 grid place-items-center border border-l-0 border-slate-200 rounded-r-lg text-[13px] text-slate-500 bg-slate-50">/{task.max_mark}</span>
          </div>
          <button onClick={() => setShowFb(!showFb)} className={`size-10 grid place-items-center rounded-lg ${showFb || feedback ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100"}`} title="Feedback"><MessageSquare size={18} /></button>
          <div className="flex-1 min-w-0 text-[11.5px] truncate">
            {status.s === "saving" && <span className="text-slate-400">Saving…</span>}
            {status.s === "returning" && <span className="text-slate-500">Building marked PDF…</span>}
            {status.s === "saved" && <span className="text-emerald-600">{status.msg}</span>}
            {status.s === "error" && <span className="text-rose-600">{status.msg}</span>}
          </div>
          <button onClick={() => send("draft")} disabled={status.s === "saving" || status.s === "returning"} className="btn-outline h-10 hidden sm:inline-flex">Save draft</button>
          <button onClick={returnAndNext} disabled={status.s === "returning"} className="btn-primary h-10 px-4">
            {status.s === "returning" ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            {nextHref ? "Return & next" : "Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
