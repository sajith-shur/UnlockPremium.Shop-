'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Zap } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=Design+%26+Creativity', label: 'Design' },
  { href: '/shop?category=AI+Tools', label: 'AI Tools' },
  { href: '/shop?category=Learning+%26+Education', label: 'Learning' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a1628]/95 backdrop-blur-md border-b border-blue-900/40 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium z-[60]"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="UnlockPremium Shop — Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/40 transition-shadow duration-200">
              <Zap className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg leading-tight">
              <span className="text-white">Unlock</span>
              <span className="text-blue-400">Premium</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  pathname === href.split('?')[0] && !href.includes('?')
                    ? 'text-blue-400 bg-blue-950/60'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/shop"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/40 hover:shadow-blue-500/30"
              id="header-browse-btn"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              Browse All
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-blue-900/40 bg-[#0a1628]/98 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href.split('?')[0] && !href.includes('?')
                    ? 'text-blue-400 bg-blue-950/60'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/shop"
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              Browse All Products
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
