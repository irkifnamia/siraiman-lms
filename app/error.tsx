"use client";
import { RotateCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = /Server Action|ChunkLoad|Loading chunk|dynamically imported module/i.test(error?.message || "");
  return (
    <div className="min-h-[60dvh] grid place-items-center px-6 text-center">
      <div className="max-w-sm">
        <img src="/logo-128.png" alt="" className="size-14 mx-auto mb-3 rounded-full" />
        <h1 className="text-[18px] font-bold">{stale ? "The app was just updated" : "Something went wrong"}</h1>
        <p className="text-[13px] text-slate-600 mt-1.5">
          {stale ? "Refresh to load the latest version. Anything you've already saved is safe."
            : "Please refresh and try again. If you were submitting work, check the task page to see if it went through."}
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <button onClick={() => window.location.reload()} className="btn-primary h-10 px-4"><RotateCw size={15} /> Refresh</button>
          {!stale && <button onClick={() => reset()} className="btn-outline h-10">Try again</button>}
        </div>
        {error?.digest && <p className="text-[10.5px] text-slate-400 mt-4">Ref: {error.digest}</p>}
      </div>
    </div>
  );
}
