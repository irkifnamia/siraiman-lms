import { PDFDocument, StandardFonts, degrees, rgb, LineCapStyle, type PDFPage } from "pdf-lib";
import type { Annotations } from "./ink";

const hex = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** JPEG EXIF orientation → clockwise rotation in degrees (mirrored variants treated as their rotation). */
function jpegRotation(b: Uint8Array): number {
  if (b[0] !== 0xff || b[1] !== 0xd8) return 0;
  let i = 2;
  while (i + 4 < b.length) {
    if (b[i] !== 0xff) return 0;
    const marker = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
    if (marker === 0xe1 && String.fromCharCode(...b.slice(i + 4, i + 8)) === "Exif") {
      const t = i + 10, le = b[t] === 0x49;
      const u16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
      const u32 = (o: number) => (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
      const ifd = t + u32(t + 4), n = u16(ifd);
      for (let e = 0; e < n; e++) {
        const p = ifd + 2 + e * 12;
        if (u16(p) === 0x0112) {
          const o = u16(p + 8);
          return o === 3 || o === 4 ? 180 : o === 6 || o === 5 ? 90 : o === 8 || o === 7 ? 270 : 0;
        }
      }
      return 0;
    }
    if (marker === 0xda) return 0;
    i += 2 + len;
  }
  return 0;
}

/** Map a displayed-page normalised point to unrotated top-left page coordinates. */
function mapper(page: PDFPage) {
  const { width: W, height: H } = page.getSize();
  const r = ((page.getRotation().angle % 360) + 360) % 360;
  const dispW = r === 90 || r === 270 ? H : W;
  const map = (u: number, v: number): [number, number] =>
    r === 90 ? [v * W, (1 - u) * H] : r === 180 ? [(1 - u) * W, (1 - v) * H] : r === 270 ? [(1 - v) * W, u * H] : [u * W, v * H];
  return { W, H, r, dispW, map };
}

/** Build the marked PDF: original (PDF or JPEG/PNG) + vector ink + text. */
export async function buildMarkedPdf(src: Uint8Array, mime: string, ann: Annotations): Promise<Uint8Array> {
  let doc: PDFDocument;
  if (mime === "application/pdf") {
    doc = await PDFDocument.load(src, { ignoreEncryption: true });
  } else if (mime === "image/jpeg" || mime === "image/png") {
    doc = await PDFDocument.create();
    const img = mime === "image/png" ? await doc.embedPng(src) : await doc.embedJpg(src);
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height)); // keep pages a sane size in points
    const w = img.width * scale, h = img.height * scale;
    const page = doc.addPage([w, h]);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
    if (mime === "image/jpeg") page.setRotation(degrees(jpegRotation(src)));
  } else {
    throw new Error("Only PDF, JPG and PNG files can be annotated.");
  }

  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  for (const it of ann.items) {
    const page = pages[it.page];
    if (!page) continue;
    const { H, r, dispW, map } = mapper(page);
    if (it.k === "ink") {
      if (it.pts.length < 2) continue;
      let d = "";
      for (let i = 0; i < it.pts.length; i += 2) {
        const [x, y] = map(it.pts[i], it.pts[i + 1]);
        d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      if (it.pts.length === 2) { const [x, y] = map(it.pts[0], it.pts[1]); d += `L${(x + 0.01).toFixed(2)} ${y.toFixed(2)}`; }
      page.drawSvgPath(d, {
        x: 0, y: H, borderColor: hex(it.color), borderWidth: Math.max(0.3, it.w * dispW),
        borderOpacity: it.op ?? 1, borderLineCap: LineCapStyle.Round,
      });
    } else {
      const [x, y] = map(it.x, it.y);
      const safe = it.text.replace(/[^\x20-\x7E -ÿ]/g, "?");
      page.drawText(safe, { x, y: H - y, size: Math.max(4, it.size * dispW), font, color: hex(it.color), rotate: degrees(r) });
    }
  }
  return doc.save();
}
