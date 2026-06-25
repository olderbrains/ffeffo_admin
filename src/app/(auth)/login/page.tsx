'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { devLogin, loginWithEmail, loginWithGoogle } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

const IS_DEV = process.env.NODE_ENV === 'development';

function describeError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/invalid-api-key':
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
        return 'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      case 'FORBIDDEN':
        return 'This account does not have admin access.';
      default:
        break;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Unable to sign in. Please try again.';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Signed in successfully');
      router.replace('/');
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in successfully');
      router.replace('/');
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (devEmail: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await devLogin(devEmail);
      toast.success(`Signed in as ${devEmail}`);
      router.replace('/');
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Speffo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your store</p>
        </div>

        <form className="space-y-4" onSubmit={handleEmailLogin}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@speffo.com"
              className="w-full rounded-md border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-md border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        {IS_DEV && (
          <div className="space-y-2 rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 p-3">
            <p className="text-center text-xs font-medium text-amber-600 dark:text-amber-400">
              Dev login (local only — no Firebase)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['superadmin@speffo.com', 'admin@speffo.com', 'manager@speffo.com', 'support@speffo.com'].map(
                (devEmail) => (
                  <button
                    key={devEmail}
                    type="button"
                    onClick={() => handleDevLogin(devEmail)}
                    disabled={loading}
                    className="rounded-md border bg-background px-2 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {devEmail.split('@')[0]}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
