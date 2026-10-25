import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Globe } from 'lucide-react';
import { CATEGORIES, PRODUCTS, getProductsByCategory } from '@/app/lib/products';
import ProductCard from '@/app/components/ProductCard';
import CategoryCard from '@/app/components/CategoryCard';

export const metadata: Metadata = {
  title: 'UnlockPremium Shop — Unlock More. Spend Less.',
  description:
    'UK digital subscription marketplace. Browse curated deals on software, creative tools, AI platforms, education, music and streaming entertainment.',
};

const STATS = [
  { value: '6', label: 'Categories' },
  { value: '12+', label: 'Products' },
  { value: 'UK', label: 'Based' },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, text: 'Secure & Trusted' },
  { icon: Globe, text: 'UK-Based Store' },
  { icon: Sparkles, text: 'Premium Selection' },
];

export default function HomePage() {
  // Featured products: one from each category (first occurrence)
  const featuredSlugs = [
    'canva-pro-annual',
    'microsoft-365-personal',
    'google-one-ai-premium',
    'duolingo-super-annual',
    'spotify-premium-individual',
    'disney-plus-standard',
  ];
  const featured = featuredSlugs
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean) as typeof PRODUCTS;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(124,58,237,0.15) 0%, transparent 60%), #0a1628',
          }}
          aria-hidden="true"
        />

        {/* Glow orbs */}
        <div
          className="glow-orb animate-pulse-glow w-80 h-80 -top-20 -left-20 opacity-30"
          style={{ background: 'rgba(37,99,235,0.4)' }}
          aria-hidden="true"
        />
        <div
          className="glow-orb animate-float w-64 h-64 top-10 right-0 opacity-20"
          style={{ background: 'rgba(124,58,237,0.4)', animationDelay: '1.5s' }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/50 text-blue-300 text-xs font-medium mb-6 animate-slide-up">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            UK Digital Subscription Marketplace
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Unlock{' '}
            <span className="gradient-text">More.</span>
            <br />
            Spend{' '}
            <span className="gradient-text">Less.</span>
          </h1>

          {/* Subheading */}
          <p
            className="max-w-2xl mx-auto text-slate-300 text-lg sm:text-xl leading-relaxed mb-10 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Curated digital subscriptions across software, creative tools, AI platforms, education,
            music and entertainment — all in one UK store.
          </p>

          {/* Demo notice */}
          <p className="text-xs text-amber-400/80 mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            ⚠️ Demonstration catalogue — not currently selling live products
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/shop"
              id="hero-browse-btn"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-900/40 hover:shadow-blue-500/30 transition-all duration-200 group"
            >
              Browse Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="#categories"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-blue-700/50 text-slate-300 hover:text-white hover:border-blue-500/60 hover:bg-white/5 font-semibold text-base transition-all duration-200"
            >
              View Categories
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-14 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ─────────────────────────────────────────────────── */}
      <section aria-label="Trust indicators" className="border-y border-blue-900/30 bg-blue-950/20 py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          {TRUST_BADGES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-slate-300 text-sm">
              <Icon className="w-4 h-4 text-blue-400" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section id="categories" aria-labelledby="categories-heading" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="categories-heading"
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Browse by Category
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Find exactly what you need across our six carefully curated subscription categories.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
            {CATEGORIES.map((cat) => {
              const count = getProductsByCategory(cat.name).length;
              return (
                <li key={cat.name}>
                  <CategoryCard
                    name={cat.name}
                    description={cat.description}
                    icon={cat.icon}
                    gradient={cat.gradient}
                    count={count}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section aria-labelledby="featured-heading" className="py-20 bg-blue-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 id="featured-heading" className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Featured Products
              </h2>
              <p className="text-slate-400 text-lg">
                A hand-picked selection from our demonstration catalogue.
              </p>
            </div>
            <Link
              href="/shop"
              className="shrink-0 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors group"
            >
              View all products
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {featured.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section aria-label="Call to action" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="relative rounded-3xl overflow-hidden p-10 sm:p-16"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(124,58,237,0.2) 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <div
              className="glow-orb w-64 h-64 -top-20 -right-20 opacity-20"
              style={{ background: 'rgba(124,58,237,0.6)' }}
              aria-hidden="true"
            />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative z-10">
              Ready to explore?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto relative z-10">
              Browse our full demonstration catalogue — spanning AI tools, creative software, learning platforms and more.
            </p>
            <Link
              href="/shop"
              className="relative z-10 inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-900/40 transition-all duration-200 group"
            >
              See All Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
