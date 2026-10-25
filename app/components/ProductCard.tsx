import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';
import type { Product } from '@/app/lib/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article
      className="product-card glass-card rounded-2xl overflow-hidden flex flex-col h-full"
      aria-label={`${product.name} — demonstration product`}
    >
      {/* Card header with gradient accent */}
      <div className={`relative h-24 bg-gradient-to-br ${product.gradient} flex items-center justify-center overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <span className="text-4xl relative z-10" role="img" aria-label={product.name}>
          {product.icon}
        </span>
        {product.badge && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30">
            {product.badge}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col p-5">
        {/* Category */}
        <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">
          {product.category}
        </p>

        {/* Name & tagline */}
        <h3 className="text-white font-semibold text-base leading-snug mb-1">
          {product.name}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
          {product.tagline}
        </p>

        {/* Demo price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-white font-bold text-xl" aria-label={`Demo price £${product.demoPrice.toFixed(2)}`}>
            £{product.demoPrice.toFixed(2)}
          </span>
          {product.demoOriginalPrice && (
            <span className="text-slate-500 text-sm line-through" aria-label={`Was £${product.demoOriginalPrice.toFixed(2)}`}>
              £{product.demoOriginalPrice.toFixed(2)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 font-medium">
            <Tag className="w-3 h-3" aria-hidden="true" />
            Demo
          </span>
        </div>

        {/* CTA */}
        <Link
          href={`/products/${product.slug}`}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 group"
          aria-label={`View ${product.name} details`}
        >
          View Details
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
