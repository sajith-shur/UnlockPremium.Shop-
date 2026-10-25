import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop — Browse All Products',
  description:
    'Browse our full demonstration catalogue of digital subscriptions: software, AI tools, creative apps, education platforms, music and streaming.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
