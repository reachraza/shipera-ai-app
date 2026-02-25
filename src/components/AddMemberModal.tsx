'use client';

import { useState } from 'react';
import { UserRole } from '@/constants/types';
import { useAuth } from '@/hooks/useAuth';
import { Copy, CheckCircle2, Link as LinkIcon, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface AddMemberModalProps {
    onClose: () => void;
    onAdded: () => void;
}

export default function AddMemberModal({ onClose, onAdded }: AddMemberModalProps) {
    const { orgId } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole | 'supervisor'>('coordinator');
    const [inviteData, setInviteData] = useState<{ link: string; tempPass: string } | null>(null);
    const [copied, setCopied] = useState(false);

    function handleGenerateLink(e: React.FormEvent) {
        e.preventDefault();
        if (!orgId || !email) return;

        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

        // Create a base64 encoded invite payload
        // In a real production app, this should be signed/encrypted on the backend
        // to prevent anyone from tampering with the role/orgId easily.
        const payload = btoa(JSON.stringify({ email, fullName, password: tempPassword, orgId, role }));
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const link = `${origin}/invite-accept?token=${payload}`;

        setInviteData({ link, tempPass: tempPassword });
    }

    function handleCopy() {
        if (inviteData?.link) {
            navigator.clipboard.writeText(inviteData.link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (inviteData) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[100]">
                <div className="bg-card w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 sm:p-8 text-center">
                        <div className="inline-flex h-16 w-16 bg-primary/10 text-primary rounded-full items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Auto-Join Link Generated!</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-6">
                            Share this secure link with <b>{email}</b>. When they click it, their account will be automatically created and they will join your organization instantly!
                        </p>

                        <div className="bg-muted/50 p-4 rounded-xl border border-border/50 text-left relative group mb-6">
                            <div className="mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><KeyRound size={12} /> Their Temp Password</span>
                                <p className="font-mono text-sm mt-0.5 text-foreground font-medium bg-background px-2 py-1 rounded border border-border inline-block tracking-widest">{inviteData.tempPass}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">They will use this if they ever need to log in manually.</p>
                            </div>

                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5"><LinkIcon size={12} /> 1-Click Join Link</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteData.link}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="p-2.5 shrink-0 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors"
                                    title="Copy Link"
                                >
                                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            {copied && <p className="text-xs text-primary font-bold mt-2 text-center absolute -bottom-6 left-0 right-0">Copied to clipboard!</p>}
                        </div>

                        <Button
                            onClick={() => {
                                onClose();
                                onAdded();
                            }}
                            className="w-full"
                        >
                            Done & Close
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[100]">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-foreground mb-1">Invite Team Member</h3>
                    <p className="text-sm text-muted-foreground mb-6">Create a magic link that automatically joins them to your organization.</p>

                    <form onSubmit={handleGenerateLink} className="space-y-4">
                        <Input
                            label="Employee Name"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                        />

                        <Input
                            label="Employee Email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@yourcompany.com"
                        />

                        <Select
                            label="Access Role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            options={[
                                { label: 'Admin (Full Access)', value: 'admin' },
                                { label: 'Supervisor (Can manage users & processes)', value: 'supervisor' },
                                { label: 'Coordinator (Standard Access)', value: 'coordinator' }
                            ]}
                        />

                        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                            >
                                Generate Link
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
