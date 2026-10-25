import type { Metadata } from 'next';

/**
 * SEO & Deployment Environment Configuration
 *
 * During demonstration / staging mode on Firebase:
 * - IS_PRODUCTION_LAUNCH is false
 * - robots is set to { index: false, follow: false } (noindex, nofollow)
 * - SITE_URL points to the development hosting URL (preventing crawler confusion)
 * - Demonstration sitemaps are omitted
 *
 * When ready for official public production launch at unlockpremium.shop:
 * Set NEXT_PUBLIC_SITE_LAUNCHED=true in your environment variables, or update IS_PRODUCTION_LAUNCH to true.
 */

export const IS_PRODUCTION_LAUNCH = process.env.NEXT_PUBLIC_SITE_LAUNCHED === 'true';

export const SITE_URL = IS_PRODUCTION_LAUNCH
  ? 'https://unlockpremium.shop'
  : 'https://unlockshop.web.app';

export const ROBOTS_CONFIG: Metadata['robots'] = IS_PRODUCTION_LAUNCH
  ? { index: true, follow: true }
  : {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    };
