export function PageSkeleton({ rows = 5, stats = 3 }: { rows?: number; stats?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-5" />
      {stats > 0 && (
        <div className={`grid gap-2.5 mb-6`} style={{ gridTemplateColumns: `repeat(${stats}, minmax(0,1fr))` }}>
          {Array.from({ length: stats }).map((_, i) => <div key={i} className="card h-[70px]" />)}
        </div>
      )}
      <div className="card divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-3.5 py-3.5">
            <div className="h-3.5 w-2/3 bg-slate-200 rounded mb-2" />
            <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
