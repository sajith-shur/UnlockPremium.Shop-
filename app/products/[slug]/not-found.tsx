import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl mb-6" aria-hidden="true">📦</p>
      <h2 className="text-3xl font-bold text-white mb-3">Product not found</h2>
      <p className="text-slate-400 text-lg mb-8 max-w-sm">
        We couldn&apos;t find a product with that URL. It may have been removed or the link might be incorrect.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        Back to Shop
      </Link>
    </div>
  );
}
