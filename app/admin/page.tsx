'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth, AdminRouteGuard } from '@/app/lib/auth-context';
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  ExternalLink,
  Layers,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <AdminRouteGuard>
      <AdminDashboardContent />
    </AdminRouteGuard>
  );
}

function AdminDashboardContent() {
  const { user, isAdmin, isEmailVerified, logout, refreshClaims } = useAdminAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleRefreshClaims = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    const valid = await refreshClaims();
    setIsRefreshing(false);
    if (valid) {
      setRefreshMessage('Administrative claims successfully re-verified from server.');
    } else {
      setRefreshMessage('Could not verify administrative privileges. Please try again or re-authenticate.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#070b19]">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0d1527]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">UnlockPremium</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Administrative Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors border border-slate-700/60 rounded-lg hover:border-slate-600"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Welcome & Security Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/40 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authenticated Session
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  admin: true
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back, {user?.email || 'Administrator'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Your administrative session is verified. Privileged Firestore read and write operations are authorized under active security rules.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRefreshClaims}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Claims</span>
              </button>
            </div>
          </div>

          {refreshMessage && (
            <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{refreshMessage}</span>
            </div>
          )}
        </div>

        {/* Security & System Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d1527]/80 border border-slate-800/80 rounded-xl p-4.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1.5">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Privilege Tier</span>
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>Full Administrator</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Verified custom claim token</p>
          </div>

          <div className="bg-[#0d1527]/80 border border-slate-800/80 rounded-xl p-4.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Email Verification</span>
            </div>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEmailVerified ? 'Verified' : 'Pending'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Required for administrative actions</p>
          </div>

          <div className="bg-[#0d1527]/80 border border-slate-800/80 rounded-xl p-4.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1.5">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Database Backend</span>
            </div>
            <div className="text-base font-bold text-white">Firestore Native</div>
            <p className="text-[11px] text-slate-400 mt-1">Region: europe-west2 (London)</p>
          </div>

          <div className="bg-[#0d1527]/80 border border-slate-800/80 rounded-xl p-4.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Session Persistence</span>
            </div>
            <div className="text-base font-bold text-white">Browser Session</div>
            <p className="text-[11px] text-slate-400 mt-1">Terminates on tab/browser closure</p>
          </div>
        </div>

        {/* Phase 2 Stage C Placeholder Card */}
        <div className="bg-[#0d1527]/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-white">Product Management Dashboard</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Stage C
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                The product editor, catalog manager, variant duration pricing, activation type controls, and brand asset review documentation will be enabled in Stage C. Stage B has established secure administrator authentication, claim verification, session management, and Firestore security alignment.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-4 text-center text-slate-400 text-xs">
        UnlockPremium Shop &bull; Administrative Operations &bull; Internal Access Only
      </footer>
    </div>
  );
}
