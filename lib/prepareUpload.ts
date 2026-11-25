/**
 * Make student uploads phone-friendly before they leave the device:
 * - photos are resized + JPEG-compressed (iPhone photos are often 3–6 MB)
 * - several photos are combined into ONE PDF (one page per photo)
 * - a single PDF is sent as-is if it fits
 */
export const LIMIT = 3.8 * 1024 * 1024; // stay under the server's 4 MB limit

const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name);

async function toJpeg(file: File, maxSide: number, quality: number): Promise<{ bytes: Uint8Array; w: number; h: number }> {
  let src: ImageBitmap | HTMLImageElement;
  try {
    src = await createImageBitmap(file, { imageOrientation: "from-image" } as any);
  } catch {
    src = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error(`Can't read the photo “${file.name}”.`));
      img.src = URL.createObjectURL(file);
    });
  }
  const sw = (src as any).width, sh = (src as any).height;
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.round(sw * k), h = Math.round(sh * k);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(src as any, 0, 0, w, h);
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't compress the photo."))), "image/jpeg", quality));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
}

export async function prepareUpload(files: File[], onStatus?: (s: string) => void): Promise<File> {
  if (!files.length) throw new Error("Choose a file first.");
  const imgs = files.filter(isImage), others = files.filter((f) => !isImage(f));
  if (others.length && imgs.length) throw new Error("Upload either photos or one PDF, not both.");
  if (others.length > 1) throw new Error("Upload one PDF only (or several photos).");
  if (others.length === 1) {
    if (others[0].size > LIMIT) throw new Error("This PDF is larger than 4 MB. Compress it (e.g. ilovepdf.com) or upload photos of your work instead.");
    return others[0];
  }
  const { PDFDocument } = await import("pdf-lib");
  for (const [maxSide, q] of [[1800, 0.72], [1400, 0.62], [1100, 0.55]] as const) {
    const doc = await PDFDocument.create();
    for (let i = 0; i < imgs.length; i++) {
      onStatus?.(`Preparing photo ${i + 1} of ${imgs.length}…`);
      const j = await toJpeg(imgs[i], maxSide, q);
      const img = await doc.embedJpg(j.bytes);
      const scale = 842 / Math.max(j.w, j.h); // longest side = A4 height in points
      const page = doc.addPage([j.w * scale, j.h * scale]);
      page.drawImage(img, { x: 0, y: 0, width: j.w * scale, height: j.h * scale });
    }
    const bytes = await doc.save();
    if (bytes.length <= LIMIT) {
      const name = imgs.length === 1 ? imgs[0].name.replace(/\.[^.]+$/, "") + ".pdf" : `${imgs.length}-pages.pdf`;
      return new File([bytes.slice().buffer as ArrayBuffer], name, { type: "application/pdf" });
    }
  }
  throw new Error("Too many photos to fit in 4 MB. Try fewer pages per upload, or a scanned PDF.");
}
