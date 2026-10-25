export default function ProductLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex gap-2 mb-8">
        {[80, 50, 120, 100].map((w, i) => (
          <div key={i} className="h-4 bg-blue-950/60 rounded" style={{ width: w }} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          {/* Image skeleton */}
          <div className="h-80 rounded-3xl bg-blue-950/50 mb-8" />
          {/* Text skeletons */}
          <div className="h-4 w-32 bg-blue-950/50 rounded mb-3" />
          <div className="h-10 w-72 bg-blue-900/40 rounded mb-3" />
          <div className="h-6 w-56 bg-blue-950/40 rounded mb-6" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-blue-950/30 rounded" style={{ width: `${60 + i * 8}%` }} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-80 rounded-3xl bg-blue-950/40" />
        </div>
      </div>
    </div>
  );
}
