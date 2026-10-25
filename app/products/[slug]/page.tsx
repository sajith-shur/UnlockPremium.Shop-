import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle, Tag, AlertTriangle, ExternalLink } from 'lucide-react';
import { getAllProducts, getProductBySlug } from '@/app/lib/products';
import { ROBOTS_CONFIG } from '@/app/lib/seo';

// Pre-generate pages for all demo products at build time
export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

// Per-product metadata
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.name} (Demo) — ${product.category}`,
    description: product.description.slice(0, 160),
    robots: ROBOTS_CONFIG,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="hover:text-blue-400 transition-colors">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-blue-400 transition-colors"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-200" aria-current="page">{product.name}</span>
      </nav>

      {/* Back link */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 text-sm font-medium transition-colors mb-8 group"
        aria-label="Back to all products"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* ── Left column: Product hero ───────────────────────────────── */}
        <div className="lg:col-span-3">
          {/* Product visual */}
          <div
            className={`relative rounded-3xl overflow-hidden h-64 sm:h-80 bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-8`}
          >
            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
              aria-hidden="true"
            />
            <span className="text-8xl relative z-10" role="img" aria-label={product.name}>
              {product.icon}
            </span>
            {product.badge && (
              <span className="absolute top-5 right-5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold border border-white/30">
                {product.badge}
              </span>
            )}
          </div>

          {/* Category label */}
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-2">
            {product.category}
          </p>

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            {product.name}
          </h1>

          {/* Tagline */}
          <p className="text-slate-300 text-xl mb-6">{product.tagline}</p>

          {/* Description */}
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-400 leading-relaxed text-base">{product.description}</p>
          </div>

          {/* Features */}
          <div className="mt-8">
            <h2 className="text-white font-semibold text-lg mb-4">What's included</h2>
            <ul className="space-y-3" role="list">
              {product.features.map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-slate-300 text-sm">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right column: Purchase panel ────────────────────────────── */}
        <aside
          className="lg:col-span-2"
          aria-label="Product pricing and demo information"
        >
          <div className="glass-card rounded-3xl p-6 sticky top-24">
            {/* Demo badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-700/30 mb-6">
              <Tag className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <span className="text-amber-300 text-xs font-medium">
                Demonstration product — not available for purchase
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className="text-4xl font-extrabold text-white"
                  aria-label={`Demo price £${product.demoPrice.toFixed(2)}`}
                >
                  £{product.demoPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">Prices shown for demonstration only</p>
            </div>

            {/* Disabled CTA */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full py-4 rounded-2xl bg-slate-700 text-slate-400 font-bold text-base cursor-not-allowed mb-4"
            >
              Coming Soon
            </button>

            {/* Info box */}
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/30 p-4 mb-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                This is a <strong className="text-slate-300">demonstration product</strong> used to showcase the UnlockPremium Shop storefront. Purchasing will be enabled in a future release.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
              <span>
                Brand names belong to their respective owners. UnlockPremium Shop is not an authorised partner of any brand displayed.
              </span>
            </div>
          </div>

          {/* Sister store callout */}
          <div className="mt-4 rounded-2xl glass-card p-4">
            <p className="text-slate-400 text-xs mb-2">Looking for LinkedIn Premium?</p>
            <a
              href="https://unlockpremium.store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              aria-label="Visit unlockpremium.store for LinkedIn Premium (opens in new tab)"
            >
              Visit unlockpremium.store
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>

      {/* Related category link */}
      <div className="mt-16 pt-10 border-t border-blue-900/30">
        <h2 className="text-lg font-semibold text-white mb-4">More in {product.category}</h2>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-700/40 text-blue-400 hover:text-white hover:border-blue-500/60 hover:bg-blue-950/40 text-sm font-medium transition-all"
        >
          Browse {product.category}
          <ArrowLeft className="w-4 h-4 rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
