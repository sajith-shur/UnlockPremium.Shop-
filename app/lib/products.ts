/**
 * UnlockPremium Shop — Product data model & sample catalogue
 *
 * ⚠️  DEMONSTRATION DATA ONLY
 * These are sample product concepts for UI development purposes.
 * This store is not an authorised partner of any brand listed below.
 * No real purchases can be made from this demonstration catalogue.
 */

export type Category =
  | 'Design & Creativity'
  | 'Office & Productivity'
  | 'AI Tools'
  | 'Learning & Education'
  | 'Music & Entertainment'
  | 'TV & Streaming';

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  /** Demo price in GBP — NOT a live offer */
  demoPrice: number;
  /** Demo original price in GBP — for display only */
  demoOriginalPrice?: number;
  badge?: string;
  features: string[];
  icon: string; // emoji fallback icon
  gradient: string; // Tailwind gradient classes for card accent
  isDemo: true; // always true — forces consumers to acknowledge demo status
}

export const CATEGORIES: { name: Category; description: string; icon: string; gradient: string }[] = [
  {
    name: 'Design & Creativity',
    description: 'Professional creative tools for designers and artists',
    icon: '🎨',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Office & Productivity',
    description: 'Essential software to power your workday',
    icon: '💼',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'AI Tools',
    description: 'Next-generation AI platforms for professionals',
    icon: '🤖',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Learning & Education',
    description: 'Courses and language learning subscriptions',
    icon: '📚',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    name: 'Music & Entertainment',
    description: 'Premium music streaming and entertainment',
    icon: '🎵',
    gradient: 'from-green-500 to-lime-500',
  },
  {
    name: 'TV & Streaming',
    description: 'Licensed entertainment and streaming services',
    icon: '📺',
    gradient: 'from-red-500 to-rose-500',
  },
];

export const PRODUCTS: Product[] = [
  // ── Design & Creativity ──────────────────────────────────────────────────
  {
    id: 'canva-pro-1yr',
    slug: 'canva-pro-annual',
    name: 'Canva Pro — Annual',
    tagline: 'Professional design for everyone',
    description:
      'Access premium Canva Pro templates, brand kits, background remover and AI design tools. Perfect for marketers, social media managers and small business owners who want polished visuals without design experience.',
    category: 'Design & Creativity',
    demoPrice: 89.99,
    demoOriginalPrice: 109.99,
    badge: 'Popular',
    features: [
      'Unlimited premium templates',
      'Brand Kit & logo upload',
      'Background Remover tool',
      'Magic Resize for all platforms',
      '100 GB cloud storage',
      'Schedule social media posts',
    ],
    icon: '🎨',
    gradient: 'from-purple-600 to-pink-500',
    isDemo: true,
  },
  {
    id: 'adobe-cc-1mo',
    slug: 'adobe-creative-cloud-monthly',
    name: 'Adobe Creative Cloud',
    tagline: 'The complete creative suite',
    description:
      'Photoshop, Illustrator, Premiere Pro, After Effects and 20+ more applications. The industry-standard toolkit trusted by creative professionals worldwide.',
    category: 'Design & Creativity',
    demoPrice: 49.99,
    badge: 'Pro Choice',
    features: [
      '20+ professional apps',
      'Photoshop & Illustrator',
      'Premiere Pro video editing',
      '100 GB Creative Cloud storage',
      'Adobe Fonts included',
      'Regular updates included',
    ],
    icon: '✏️',
    gradient: 'from-red-600 to-orange-500',
    isDemo: true,
  },

  // ── Office & Productivity ────────────────────────────────────────────────
  {
    id: 'microsoft-365-personal',
    slug: 'microsoft-365-personal',
    name: 'Microsoft 365 Personal',
    tagline: 'Word, Excel, PowerPoint & more',
    description:
      'The complete Office suite for one person, including 1 TB OneDrive storage. Get premium versions of Word, Excel, PowerPoint, Outlook and Teams on up to 5 devices.',
    category: 'Office & Productivity',
    demoPrice: 59.99,
    demoOriginalPrice: 69.99,
    badge: 'Best Value',
    features: [
      'Word, Excel, PowerPoint',
      'Outlook email client',
      '1 TB OneDrive storage',
      'Works on PC, Mac, iOS & Android',
      'Microsoft Teams included',
      'Advanced security features',
    ],
    icon: '💼',
    gradient: 'from-blue-600 to-cyan-500',
    isDemo: true,
  },
  {
    id: 'microsoft-365-family',
    slug: 'microsoft-365-family',
    name: 'Microsoft 365 Family',
    tagline: 'Share with up to 6 people',
    description:
      'Everything in Personal, shareable with up to 6 household members, each with their own 1 TB OneDrive storage. The most cost-effective way to keep the whole family productive.',
    category: 'Office & Productivity',
    demoPrice: 79.99,
    badge: 'Family Pick',
    features: [
      'Up to 6 users included',
      '6 TB total cloud storage',
      'All Office applications',
      'Family safety tools',
      'Per-user private storage',
      'Premium support included',
    ],
    icon: '👨‍👩‍👧‍👦',
    gradient: 'from-sky-600 to-blue-500',
    isDemo: true,
  },

  // ── AI Tools ─────────────────────────────────────────────────────────────
  {
    id: 'google-one-ai-premium',
    slug: 'google-one-ai-premium',
    name: 'Google One AI Premium',
    tagline: 'Gemini Advanced + 2 TB storage',
    description:
      'Access Google\'s most capable AI model, Gemini Advanced, integrated across Gmail, Docs, Sheets and more. Includes 2 TB of Google One storage shared across Photos, Drive and Gmail.',
    category: 'AI Tools',
    demoPrice: 18.99,
    badge: 'AI Power',
    features: [
      'Gemini Advanced AI model',
      'AI in Gmail, Docs & Sheets',
      '2 TB Google One storage',
      'Priority Google support',
      'Google Photos editing AI',
      'Early access to new features',
    ],
    icon: '🤖',
    gradient: 'from-emerald-600 to-teal-500',
    isDemo: true,
  },
  {
    id: 'chatgpt-plus',
    slug: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    tagline: 'GPT-4o with priority access',
    description:
      'Priority access to OpenAI\'s most advanced models including GPT-4o, DALL·E image generation, Advanced Data Analysis and browsing. Stay ahead with the latest AI breakthroughs.',
    category: 'AI Tools',
    demoPrice: 16.99,
    badge: 'Trending',
    features: [
      'GPT-4o advanced model',
      'DALL·E image generation',
      'Advanced Data Analysis',
      'Web browsing & research',
      'Priority access during peak times',
      'Early access to new features',
    ],
    icon: '✨',
    gradient: 'from-violet-600 to-indigo-500',
    isDemo: true,
  },

  // ── Learning & Education ─────────────────────────────────────────────────
  {
    id: 'duolingo-super-annual',
    slug: 'duolingo-super-annual',
    name: 'Duolingo Super — Annual',
    tagline: 'Learn a language, ad-free',
    description:
      'The most effective language learning app, now without ads. Unlimited hearts, personalised practice, offline lessons and progress tracking. Learn Spanish, French, Japanese and 40+ more languages.',
    category: 'Learning & Education',
    demoPrice: 59.99,
    demoOriginalPrice: 79.99,
    badge: 'Save 25%',
    features: [
      '40+ languages available',
      'Ad-free experience',
      'Unlimited hearts',
      'Offline lessons mode',
      'Personalised review sessions',
      'Progress tracking & streaks',
    ],
    icon: '📚',
    gradient: 'from-green-600 to-emerald-500',
    isDemo: true,
  },
  {
    id: 'coursera-plus',
    slug: 'coursera-plus',
    name: 'Coursera Plus',
    tagline: '7,000+ courses & certificates',
    description:
      'Unlimited access to over 7,000 courses, Specialisations and Professional Certificates from world-class universities including Google, IBM, Yale and Stanford. Advance your career with recognised credentials.',
    category: 'Learning & Education',
    demoPrice: 39.99,
    badge: 'Career Boost',
    features: [
      '7,000+ courses included',
      'University certificates',
      'Google & IBM courses',
      'Learn at your own pace',
      'Mobile app included',
      'Shareable LinkedIn certificates',
    ],
    icon: '🎓',
    gradient: 'from-blue-600 to-indigo-500',
    isDemo: true,
  },

  // ── Music & Entertainment ────────────────────────────────────────────────
  {
    id: 'spotify-premium-individual',
    slug: 'spotify-premium-individual',
    name: 'Spotify Premium',
    tagline: 'Music without limits',
    description:
      'Ad-free music streaming with offline playback, highest audio quality and unlimited skips. Access over 100 million tracks and 5 million podcasts. The world\'s most popular music platform.',
    category: 'Music & Entertainment',
    demoPrice: 10.99,
    badge: 'Most Popular',
    features: [
      'Ad-free listening',
      'Offline downloads',
      'Highest audio quality',
      'Unlimited skips',
      '100M+ tracks & podcasts',
      'Cross-device playback',
    ],
    icon: '🎵',
    gradient: 'from-green-600 to-lime-500',
    isDemo: true,
  },
  {
    id: 'tidal-hifi-plus',
    slug: 'tidal-hifi-plus',
    name: 'Tidal HiFi Plus',
    tagline: 'Lossless & spatial audio',
    description:
      'Experience music the way artists intended with lossless FLAC audio, Dolby Atmos and Sony 360 Reality Audio. The audiophile\'s choice for discerning listeners who won\'t compromise on sound quality.',
    category: 'Music & Entertainment',
    demoPrice: 14.99,
    badge: 'Audiophile',
    features: [
      'Lossless FLAC audio',
      'Dolby Atmos spatial audio',
      'Sony 360 Reality Audio',
      'Exclusive artist content',
      'Offline playback',
      'High-res music videos',
    ],
    icon: '🎶',
    gradient: 'from-sky-600 to-cyan-500',
    isDemo: true,
  },

  // ── TV & Streaming ───────────────────────────────────────────────────────
  {
    id: 'iptv-premium-12mo',
    slug: 'licensed-iptv-premium',
    name: 'IPTV Premium — 12 Months',
    tagline: 'Licensed streaming for cord-cutters',
    description:
      'A licensed IPTV service providing access to a broad range of live channels, catch-up TV and on-demand content. Compatible with Smart TVs, Android devices, MAG boxes and Firestick.',
    category: 'TV & Streaming',
    demoPrice: 79.99,
    badge: 'New',
    features: [
      'Thousands of live channels',
      'Catch-up TV included',
      'On-demand library',
      'HD & 4K streams',
      'Smart TV compatible',
      'MAG & Firestick support',
    ],
    icon: '📺',
    gradient: 'from-red-600 to-rose-500',
    isDemo: true,
  },
  {
    id: 'disney-plus-standard',
    slug: 'disney-plus-standard',
    name: 'Disney+ Standard',
    tagline: 'Disney, Marvel, Star Wars & more',
    description:
      'Stream thousands of films and series from Disney, Pixar, Marvel, Star Wars and National Geographic. Enjoy family favourites alongside the latest blockbuster releases on up to 4 screens.',
    category: 'TV & Streaming',
    demoPrice: 4.99,
    demoOriginalPrice: 7.99,
    badge: 'Great Deal',
    features: [
      'Disney, Pixar & Marvel',
      'Star Wars universe',
      'National Geographic',
      '4K Ultra HD & HDR',
      'Up to 4 screens',
      'Download & watch offline',
    ],
    icon: '🎬',
    gradient: 'from-blue-700 to-indigo-600',
    isDemo: true,
  },
];

/** Return all products */
export function getAllProducts(): Product[] {
  return PRODUCTS;
}

/** Find a product by its URL slug */
export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** Filter products by category */
export function getProductsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

/** Simple search across name, tagline and description */
export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return PRODUCTS;
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
}
