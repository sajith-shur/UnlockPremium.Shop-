'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, PRODUCTS, type Category } from '@/app/lib/products';
import ProductCard from '@/app/components/ProductCard';
import SearchBar from '@/app/components/SearchBar';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = searchParams.get('q') ?? '';
  const activeCategory = searchParams.get('category') as Category | null;

  const setCategory = (cat: Category | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    let result = PRODUCTS;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    return result;
  }, [query, activeCategory]);

  const hasFilters = !!query || !!activeCategory;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          {activeCategory ? activeCategory : 'All Products'}
        </h1>
        <p className="text-slate-400">
          {activeCategory
            ? `Showing demonstration products in ${activeCategory}`
            : 'Browse our full demonstration product catalogue'}
        </p>
      </div>

      {/* Search + filters toolbar */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search bar */}
        <SearchBar className="w-full max-w-xl" placeholder="Search by name, type or category…" />

        {/* Category filter pills */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Category filters">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Filter:
          </span>

          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              !activeCategory
                ? 'bg-blue-600 text-white border-blue-500'
                : 'glass-card text-slate-300 border-transparent hover:border-blue-700/50 hover:text-white'
            }`}
            aria-pressed={!activeCategory}
          >
            All
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeCategory === cat.name
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'glass-card text-slate-300 border-transparent hover:border-blue-700/50 hover:text-white'
              }`}
              aria-pressed={activeCategory === cat.name}
            >
              <span aria-hidden="true">{cat.icon}</span>{' '}
              {cat.name}
            </button>
          ))}

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/40 transition-all ml-2"
              aria-label="Clear all filters"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-400" aria-live="polite" aria-atomic="true">
        <Filter className="w-4 h-4" aria-hidden="true" />
        <span>
          {filtered.length === 0
            ? 'No products found'
            : `${filtered.length} demonstration product${filtered.length !== 1 ? 's' : ''}${activeCategory ? ` in ${activeCategory}` : ''}${query ? ` matching "${query}"` : ''}`}
        </span>
      </div>

      {/* Demo disclaimer */}
      <div className="mb-8 px-4 py-3 rounded-xl border border-amber-700/30 bg-amber-950/20 text-xs text-amber-300/80 flex items-start gap-2">
        <span aria-hidden="true">⚠️</span>
        <span>
          <strong>Demonstration catalogue only.</strong> Products shown are sample concepts for UI purposes. This store is not an authorised partner of any brand shown. No real purchases can be made.
        </span>
      </div>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list">
          {filtered.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-20">
          <p className="text-6xl mb-4" aria-hidden="true">🔍</p>
          <h2 className="text-xl font-semibold text-white mb-2">No products found</h2>
          <p className="text-slate-400 mb-6">
            Try a different search term or remove your category filter.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

function ShopStaticFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">All Products</h1>
        <p className="text-slate-400">Browse our full demonstration product catalogue</p>
      </div>

      {/* Static search + filters toolbar */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="w-full max-w-xl relative">
          <div className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-slate-400 text-sm">
            Search by name, type or category…
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Category filters">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Filter:
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white border border-blue-500">
            All
          </span>
          {CATEGORIES.map((cat) => (
            <a
              key={cat.name}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium glass-card text-slate-300 border border-transparent hover:border-blue-700/50 hover:text-white transition-all"
            >
              <span aria-hidden="true">{cat.icon}</span> {cat.name}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm text-slate-400">
        <Filter className="w-4 h-4" aria-hidden="true" />
        <span>12 demonstration products</span>
      </div>

      <div className="mb-8 px-4 py-3 rounded-xl border border-amber-700/30 bg-amber-950/20 text-xs text-amber-300/80 flex items-start gap-2">
        <span aria-hidden="true">⚠️</span>
        <span>
          <strong>Demonstration catalogue only.</strong> Products shown are sample concepts for UI purposes. This store is not an authorised partner of any brand shown. No real purchases can be made.
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list">
        {PRODUCTS.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopStaticFallback />}>
      <ShopContent />
    </Suspense>
  );
}
