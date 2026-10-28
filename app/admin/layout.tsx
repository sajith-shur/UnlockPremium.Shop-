import React, { ReactNode } from 'react';
import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/app/lib/auth-context';

export const metadata: Metadata = {
  title: 'Administrator Portal | UnlockPremium Shop',
  description: 'Authorized administrative management portal for UnlockPremium Shop.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col font-sans">
        {children}
      </div>
    </AdminAuthProvider>
  );
}
