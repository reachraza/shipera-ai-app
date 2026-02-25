'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function SignupContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [invitedOrgId, setInvitedOrgId] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<any>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const inviteParam = searchParams.get('invite');
    if (inviteParam) {
      try {
        const payload = JSON.parse(atob(inviteParam));
        if (payload.orgId && payload.role) {
          setInvitedOrgId(payload.orgId);
          setInvitedRole(payload.role);
          setOrgName('Invited to existing organization');
        }
      } catch (e) {
        console.error('Invalid invite link');
        setError('Invalid or corrupted invite link.');
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error, needsConfirmation } = await signUp(email, password, orgName, fullName, invitedOrgId || undefined, invitedRole || undefined);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (needsConfirmation) {
      setNeedsConfirmation(true);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 relative">
            <Image
              src="/logo.png"
              alt="Shipera Logo"
              fill
              className="object-contain drop-shadow-2xl rounded-full"
              priority
            />
          </div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter">
            SHIPERA<span className="text-primary">.AI</span>
          </h1>
          <p className="mt-3 text-muted-foreground font-medium">Join the future of freight</p>
        </div>

        <div className="glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />

          {needsConfirmation ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Check Your Email</h2>
              <p className="text-muted-foreground mb-2">
                We&apos;ve sent a confirmation link to
              </p>
              <p className="text-foreground font-semibold mb-6">{email}</p>
              <p className="text-sm text-muted-foreground mb-8">
                Click the link in the email to verify your account and get started.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 text-center"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-6">Create Account</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {error}
                  </div>
                )}

                <Input
                  label="Organization Name"
                  id="orgName"
                  name="orgName"
                  type="text"
                  required
                  disabled={!!invitedOrgId}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Logistics"
                />

                <Input
                  label="Full Name"
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />

                <Input
                  label="Work Email"
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />

                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full mt-2"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-secondary hover:text-foreground font-bold tracking-wide hover:underline transition-colors mt-1 inline-block">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div></div>}>
      <SignupContent />
    </Suspense>
  );
}
