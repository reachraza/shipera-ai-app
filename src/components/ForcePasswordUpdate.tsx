'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/config/supabase';
import { ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForcePasswordUpdate() {
    const { appUser, signOut } = useAuth();
    const supabase = createClient();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!appUser?.needs_password_change) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Update the password in Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) throw authError;

            // 2. Clear the needs_password_change flag in our users table
            const { error: dbError } = await supabase
                .from('users')
                .update({ needs_password_change: false })
                .eq('id', appUser!.id);

            if (dbError) throw dbError;

            // 3. Force a reload to refresh the Auth context and remove the full-screen blocker
            window.location.reload();

        } catch (err) {
            const error = err as Error;
            console.error('Failed to update password:', error);
            setError(error.message || 'Failed to update password. Please try again.');
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                        <ShieldAlert size={32} />
                    </div>

                    <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">
                        Action Required
                    </h2>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Your account was created via an automated invite with a temporary password. For your security, you must set a new, private password before accessing the dashboard.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <Input
                            label="New Password"
                            icon={<KeyRound size={14} className="text-muted-foreground mr-1" />}
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                        />

                        <Button
                            type="submit"
                            disabled={loading || !password}
                            isLoading={loading}
                            className="w-full gap-2"
                        >
                            Secure My Account & Continue
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border/50 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => signOut()}
                            className="text-xs"
                        >
                            Cancel and Log Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
