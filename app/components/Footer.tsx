import Link from 'next/link';
import { Zap, ExternalLink, Mail, Shield, Globe } from 'lucide-react';
import { CATEGORIES } from '@/app/lib/products';

// Static year — safe for Next.js prerendering (no unstable Date() at render time)
const CURRENT_YEAR = 2026;

export default function Footer() {
  const year = CURRENT_YEAR;

  return (
    <footer className="border-t border-blue-900/40 bg-[#050d1a] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group" aria-label="UnlockPremium Shop — Home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-lg">
                <span className="text-white">Unlock</span>
                <span className="text-blue-400">Premium</span>
                <span className="text-slate-200 font-semibold ml-1.5 text-base">Shop</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              UK-based digital subscription marketplace. Premium software, creative tools, AI platforms and entertainment — all in one place.
            </p>
            <p className="text-slate-500 text-xs italic">
              ⚠️ This site is currently showing demonstration products only. No real purchases can be made at this time.
            </p>
          </div>

          {/* Categories column */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="text-slate-400 hover:text-blue-400 text-sm transition-colors duration-150 flex items-center gap-1.5"
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links column */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/shop" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Shop All</Link>
              </li>
              <li>
                <Link href="/shop?category=AI+Tools" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">AI Tools</Link>
              </li>
              <li>
                <Link href="/shop?category=Learning+%26+Education" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Learning</Link>
              </li>
            </ul>

            {/* Sister store */}
            <div className="mt-6 p-3 rounded-lg border border-blue-800/40 bg-blue-950/30">
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" aria-hidden="true" />
                Sister Store
              </p>
              <a
                href="https://unlockpremium.store"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                aria-label="Visit unlockpremium.store — LinkedIn Premium (opens in new tab)"
              >
                unlockpremium.store
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <p className="text-xs text-slate-500 mt-1">LinkedIn Premium specialists</p>
            </div>
          </div>

          {/* Info column */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Information</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-1.5">
                <Shield className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" aria-hidden="true" />
                UK-based business
              </li>
              <li className="flex items-start gap-1.5">
                <Mail className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" aria-hidden="true" />
                <span>
                  Contact:{' '}
                  <a href="mailto:support@unlockpremium.shop" className="hover:text-blue-400 transition-colors">
                    support@unlockpremium.shop
                  </a>
                </span>
              </li>
            </ul>

            <div className="mt-4 p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs text-slate-500 leading-relaxed">
              Brand names mentioned on this site belong to their respective owners. UnlockPremium Shop is not an authorised partner or reseller of any named brand.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {year} UnlockPremium Shop. All rights reserved. Planned domain:{' '}
            <span className="text-slate-400">unlockpremium.shop</span>
          </p>
          <p className="text-slate-600 text-xs">
            Built in the UK 🇬🇧
          </p>
        </div>
      </div>
    </footer>
  );
}
