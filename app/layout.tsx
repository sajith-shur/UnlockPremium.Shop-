import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://unlockpremium.shop'),
  title: {
    default: 'UnlockPremium Shop — Unlock More. Spend Less.',
    template: '%s | UnlockPremium Shop',
  },
  description:
    'UK-based digital subscription marketplace. Save on software, creative tools, AI platforms, education, music and entertainment. Unlock More. Spend Less.',
  keywords: [
    'digital subscriptions',
    'software deals',
    'UK',
    'Canva',
    'Microsoft 365',
    'Spotify',
    'AI tools',
    'online courses',
  ],
  authors: [{ name: 'UnlockPremium Shop' }],
  creator: 'UnlockPremium Shop',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://unlockpremium.shop',
    siteName: 'UnlockPremium Shop',
    title: 'UnlockPremium Shop — Unlock More. Spend Less.',
    description:
      'UK-based digital subscription marketplace covering software, creative tools, AI, education, music and entertainment.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnlockPremium Shop — Unlock More. Spend Less.',
    description: 'UK-based digital subscription marketplace. Save on premium software and services.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-GB" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0a1628] text-slate-100 antialiased">
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
