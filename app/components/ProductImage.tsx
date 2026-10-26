'use client';

import { useState } from 'react';
import type { Product } from '@/app/lib/products';

interface ProductImageProps {
  product: Product;
  variant?: 'card' | 'detail';
  priority?: boolean;
}

export default function ProductImage({
  product,
  variant = 'card',
  priority = false,
}: ProductImageProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const brandColor = product.brandThemeColor || '#3B82F6';
  const isApprovedLogo = product.logoUsageStatus === 'approved';
  const rawImageSrc = product.coverImageUrl || product.logoUrl;
  const canDisplayOfficialAsset = isApprovedLogo && !!rawImageSrc && !imgFailed;

  const isCard = variant === 'card';
  const containerHeight = isCard ? 'h-36' : 'h-64 sm:h-80';

  // Tier 1: Approved Official Logo or Cover Image
  if (canDisplayOfficialAsset) {
    return (
      <div
        className={`relative w-full ${containerHeight} bg-slate-950 border-b border-blue-900/30 flex items-center justify-center overflow-hidden`}
        style={{
          backgroundColor: '#070d1d',
        }}
      >
        {/* Subtle contrast background grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: isCard ? '16px 16px' : '24px 24px',
          }}
          aria-hidden="true"
        />

        <img
          src={rawImageSrc}
          alt={product.imageAlt || `${product.name} official artwork`}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImgFailed(true)}
          className={`relative z-10 object-contain max-h-[75%] max-w-[80%] transition-transform duration-300 ${
            isCard ? 'group-hover:scale-105' : ''
          }`}
        />
      </div>
    );
  }

  // Tier 2: Professionally Designed Typography-based Product Graphic
  // Used when third-party logo permissions have not been established or asset is unavailable.
  return (
    <div
      className={`relative w-full ${containerHeight} bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-blue-900/20 flex flex-col items-center justify-center overflow-hidden px-4 text-center select-none`}
      aria-label={product.imageAlt || `${product.name} subscription graphic`}
    >
      {/* Soft ambient brand accent glow (restrained to avoid visual clutter) */}
      <div
        className="absolute w-44 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-30"
        style={{ backgroundColor: brandColor }}
        aria-hidden="true"
      />

      {/* Subtle fine geometric dot background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: isCard ? '20px 20px' : '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Styled brand badge card */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center rounded-xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md shadow-lg transition-transform duration-200 ${
          isCard ? 'px-4 py-3 max-w-[90%] group-hover:border-slate-600/70' : 'px-8 py-6 max-w-sm'
        }`}
      >
        {/* Brand accent indicator pill */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="w-2 h-2 rounded-full shadow-sm"
            style={{ backgroundColor: brandColor }}
            aria-hidden="true"
          />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-slate-400">
            {product.brandName || product.category}
          </span>
        </div>

        {/* Clean, prominent product typography */}
        <p
          className={`font-bold tracking-tight text-white leading-tight ${
            isCard ? 'text-sm sm:text-base line-clamp-1' : 'text-xl sm:text-2xl'
          }`}
        >
          {product.brandName ? product.name.replace(`${product.brandName} `, '') : product.name}
        </p>

        {/* Plan / Subscription descriptor */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-medium text-slate-400">
            Digital Subscription
          </span>
        </div>
      </div>

      {/* Brand accent border indicator line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${brandColor} 50%, transparent 100%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
