import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center text-center px-6">
      <div><div className="text-[40px] font-semibold text-brand-600">404</div><p className="text-slate-500 text-[13px]">Page not found.</p>
        <Link href="/" className="btn-primary mt-4">Go home</Link></div>
    </div>
  );
}
