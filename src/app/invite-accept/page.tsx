'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';

function InviteAcceptContent() {
    const searchParams = useSearchParams();
    const { signUp } = useAuth();
    const router = useRouter();

    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Validating invite link...');

    const hasAttempted = useRef(false);

    useEffect(() => {
        // We use a ref to prevent double-execution in React 18 strict mode
        if (hasAttempted.current) return;

        const token = searchParams.get('token');

        if (!token) {
            setError('Invalid or missing invite token.');
            setStatus('');
            return;
        }

        async function processInvite() {
            try {
                hasAttempted.current = true;
                setStatus('Decrypting secure token...');

                const payloadString = atob(token as string);
                const payload = JSON.parse(payloadString);

                if (!payload.email || !payload.password || !payload.orgId || !payload.role || !payload.fullName) {
                    throw new Error('Token payload is missing required fields.');
                }

                setStatus('Creating your account securely...');

                // Call signUp with the invite payload
                const { error: signUpError, needsConfirmation } = await signUp(
                    payload.email,
                    payload.password,
                    'Invited Organization', // dummy name, the trigger will ignore it because invited_org_id is present
                    payload.fullName,
                    payload.orgId,
                    payload.role
                );

                if (signUpError) {
                    throw signUpError;
                }

                if (needsConfirmation) {
                    setStatus('Account created! But email confirmation is required by this Supabase project. Please check your email.');
                    return;
                }

                setStatus('Linking to Organization... Redirecting...');

                // Wait a small moment to ensure auth state triggers have fully populated AppUser context
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);

            } catch (err) {
                const error = err as Error;
                console.error('Auto-join failed:', error);
                setError(error.message || 'Failed to process the invite. The link may have expired or been corrupted.');
                setStatus('');
            }
        }

        processInvite();
    }, [searchParams, signUp, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 px-4 py-8 text-center animate-in fade-in zoom-in-95 duration-500 delay-150">
                <div className="inline-flex items-center justify-center w-24 h-24 mb-6 relative">
                    <Image
                        src="/logo.png"
                        alt="Shipera Logo"
                        fill
                        className="object-contain drop-shadow-2xl rounded-full"
                        priority
                    />
                </div>

                <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                    Joining Shipera.AI
                </h1>

                <div className="glass-panel p-8 rounded-2xl shadow-xl border border-border relative overflow-hidden mt-6">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />

                    {error ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Invite Failed</h2>
                            <p className="text-sm text-red-500 font-medium bg-red-500/10 p-4 rounded-xl mb-6">
                                {error}
                            </p>
                            <button
                                onClick={() => router.push('/signup')}
                                className="w-full py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
                            >
                                Sign Up Manually
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in py-2">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                            <p className="text-muted-foreground font-medium animate-pulse">
                                {status}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InviteAcceptPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <InviteAcceptContent />
        </Suspense>
    );
}
