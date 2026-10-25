import type { Metadata } from 'next';
import { ROBOTS_CONFIG } from '@/app/lib/seo';

export const metadata: Metadata = {
  title: 'Shop — Browse All Products',
  description:
    'Browse our full demonstration catalogue of digital subscriptions: software, AI tools, creative apps, education platforms, music and streaming.',
  robots: ROBOTS_CONFIG,
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
