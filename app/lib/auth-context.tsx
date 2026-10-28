'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  IdTokenResult,
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from './firebase';

export interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<boolean>;
  handlePermissionDenied: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parse claims securely from ID token
  const evaluateClaims = useCallback(async (firebaseUser: User | null): Promise<boolean> => {
    if (!firebaseUser) {
      setUser(null);
      setIsAdmin(false);
      setIsEmailVerified(false);
      return false;
    }

    try {
      const tokenResult: IdTokenResult = await firebaseUser.getIdTokenResult();
      const hasAdminClaim = tokenResult.claims.admin === true;
      const verified = firebaseUser.emailVerified === true;

      setUser(firebaseUser);
      setIsAdmin(hasAdminClaim);
      setIsEmailVerified(verified);
      return hasAdminClaim && verified;
    } catch (err: unknown) {
      console.error('Error reading auth claims:', err);
      setIsAdmin(false);
      setIsEmailVerified(false);
      return false;
    }
  }, []);

  // Listen for auth state and ID token refreshes (handles claim updates & session expiry)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      await evaluateClaims(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [evaluateClaims]);

  // Login handler
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setIsLoading(true);

      try {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        // Force refresh the token immediately after sign-in to guarantee up-to-date custom claims
        const tokenResult = await credential.user.getIdTokenResult(true);
        const hasAdminClaim = tokenResult.claims.admin === true;
        const verified = credential.user.emailVerified === true;

        setUser(credential.user);
        setIsAdmin(hasAdminClaim);
        setIsEmailVerified(verified);
        setIsLoading(false);

        if (!hasAdminClaim) {
          return {
            success: false,
            error: 'Access denied. This account does not possess administrator credentials.',
          };
        }

        if (!verified) {
          return {
            success: false,
            error: 'Email verification required. Please verify your administrator email before proceeding.',
          };
        }

        return { success: true };
      } catch (err: unknown) {
        setIsLoading(false);
        const fbError = err as { code?: string; message?: string };
        let userMessage = 'Authentication failed. Please check your credentials.';

        if (
          fbError.code === 'auth/invalid-credential' ||
          fbError.code === 'auth/user-not-found' ||
          fbError.code === 'auth/wrong-password'
        ) {
          userMessage = 'Invalid email or password.';
        } else if (fbError.code === 'auth/too-many-requests') {
          userMessage = 'Access temporarily restricted due to multiple failed attempts. Please try again later.';
        } else if (fbError.code === 'auth/user-disabled') {
          userMessage = 'This administrator account has been disabled.';
        } else if (fbError.code === 'auth/network-request-failed') {
          userMessage = 'Network error. Please check your internet connection.';
        }

        setError(userMessage);
        return { success: false, error: userMessage };
      }
    },
    []
  );

  // Logout handler
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsEmailVerified(false);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Controlled claim refresh (e.g. after operator grants permissions)
  const refreshClaims = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.getIdToken(true); // force fresh token from server
      return await evaluateClaims(auth.currentUser);
    } catch (err) {
      console.error('Failed to refresh claims:', err);
      return false;
    }
  }, [evaluateClaims]);

  // Handle unexpected Firestore permission-denied responses:
  // immediately forces a fresh token check to verify if admin claim was revoked or session expired.
  const handlePermissionDenied = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const tokenResult = await auth.currentUser.getIdTokenResult(true);
      if (tokenResult.claims.admin !== true || !auth.currentUser.emailVerified) {
        setIsAdmin(false);
        setError('Your administrative privileges have been updated or revoked. Reauthentication is required.');
      }
    } catch {
      await logout();
    }
  }, [logout]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        isEmailVerified,
        isLoading,
        error,
        login,
        logout,
        refreshClaims,
        handlePermissionDenied,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

/**
 * Route Guard Component for protected admin pages
 * Handles loading, unauthenticated redirection, and Access Denied states
 */
export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, isEmailVerified, isLoading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [isLoading, user, pathname, router]);

  // Loading state with branded spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-white text-sm font-medium">Verifying Administrative Session</p>
          <p className="text-slate-400 text-xs mt-1">Checking secure credentials and permissions...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated: waiting for router redirect
  if (!user) {
    return null;
  }

  // Authenticated non-admin: Access Denied view (does not expose sensitive IDs)
  if (!isAdmin || !isEmailVerified) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>

          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {!isAdmin
              ? 'This account does not have verified administrative privileges. Administrative portal access is restricted to authorized personnel.'
              : 'Email verification is required before administrative privileges can be used. Please verify your email address.'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              Sign Out
            </button>
            <Link
              href="/"
              className="w-full py-2.5 px-4 text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin
  return <>{children}</>;
}
