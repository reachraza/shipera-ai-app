'use client';

import { useState, useEffect } from 'react';
import { getInboundEmailsByRFP } from '@/services/emailService';
import { InboundEmail } from '@/constants/types';
import { Button } from '@/components/ui/Button';
import { Mail, RefreshCw, Eye, ArrowRightLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import CreateBidFromEmailModal from './CreateBidFromEmailModal';

interface InboundEmailListProps {
    rfpId: string;
    onBidCreated?: () => void;
}

export default function InboundEmailList({ rfpId, onBidCreated }: InboundEmailListProps) {
    const [emails, setEmails] = useState<InboundEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
    const [convertingEmail, setConvertingEmail] = useState<InboundEmail | null>(null);

    useEffect(() => {
        loadEmails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rfpId]);

    async function loadEmails() {
        setLoading(true);
        try {
            const data = await getInboundEmailsByRFP(rfpId);
            setEmails(data as InboundEmail[]);
        } catch (err) {
            console.error('Failed to load inbound emails:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSync() {
        setSyncing(true);
        try {
            // Trigger the background fetch job
            await fetch('/api/email/fetch-gmail');
            // Reload the emails to show any new ones
            await loadEmails();
        } catch (err) {
            console.error('Failed to sync emails:', err);
            alert('Failed to sync emails. Please try again.');
        } finally {
            setSyncing(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-sm text-muted-foreground font-medium">
                    Carrier replies sent via email will automatically sync here.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 rounded-full px-5 hover:bg-primary/5 hover:text-primary transition-colors border-primary/20 hover:border-primary/40"
                >
                    <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync Replies'}
                </Button>
            </div>

            {emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border/60 rounded-[32px] bg-card/30">
                    <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Mail size={28} className="text-muted-foreground/60" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Replies Yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                        When carriers reply to your invitations, their messages will securely appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {emails.map((email) => (
                        <div
                            key={email.id}
                            onClick={() => setSelectedEmail(email)}
                            className="group relative p-5 sm:p-6 border border-border/60 rounded-3xl bg-card hover:bg-muted/10 hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
                        >
                            {/* Subtle Hover Gradient */}
                            <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                {/* Sender Info & Subject */}
                                <div className="flex items-start gap-4 flex-1 overflow-hidden">
                                    <div className="hidden sm:flex h-10 w-10 shrink-0 bg-primary/10 rounded-full items-center justify-center text-primary font-bold">
                                        {(email.from_name || email.from_email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-base text-foreground truncate">
                                                {email.from_name || email.from_email.split('@')[0]}
                                            </h4>
                                            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono hidden sm:inline-block truncate max-w-[150px]">
                                                {email.from_email}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground truncate mb-1">
                                            {email.subject}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-1 w-full max-w-2xl">
                                            {email.body_text?.trim() || "No text content."}
                                        </p>
                                    </div>
                                </div>

                                {/* Timestamp & Action */}
                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                                    <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1 rounded-full whitespace-nowrap">
                                        {new Date(email.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedEmail && (
                <Modal
                    isOpen={!!selectedEmail}
                    onClose={() => setSelectedEmail(null)}
                    title="Carrier Reply Details"
                >
                    <div className="space-y-6">
                        {/* Meta Header */}
                        <div className="p-5 bg-muted/20 rounded-2xl border border-border/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">From Carrier</p>
                                    <p className="font-bold text-foreground text-sm">{selectedEmail.from_name || 'Unknown Handler'}</p>
                                    <p className="text-sm text-primary font-mono mt-0.5 truncate">{selectedEmail.from_email}</p>
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Received At</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {new Date(selectedEmail.created_at).toLocaleString(undefined, {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Subject Line</p>
                            <h3 className="text-lg font-black text-foreground">{selectedEmail.subject}</h3>
                        </div>

                        {/* Body content */}
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Email Body</p>
                            <div className="bg-card border border-border/60 shadow-inner rounded-2xl p-6 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap font-sans overflow-auto max-h-[50vh]">
                                {selectedEmail.body_text?.trim() || <span className="text-muted-foreground italic">No readable text content was found in this email.</span>}
                            </div>
                        </div>

                        {/* Convert to Bid Action */}
                        {selectedEmail.matched_carrier_id && selectedEmail.rfp_id && (
                            <div className="pt-4 mt-4 border-t border-border/60 flex justify-end">
                                <Button
                                    onClick={() => {
                                        setConvertingEmail(selectedEmail);
                                        setSelectedEmail(null);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all"
                                >
                                    <ArrowRightLeft size={16} className="mr-2" />
                                    Convert to Bid
                                </Button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Email-to-Bid Modal */}
            {convertingEmail && (
                <CreateBidFromEmailModal
                    isOpen={!!convertingEmail}
                    onClose={() => setConvertingEmail(null)}
                    email={convertingEmail}
                    onSuccess={() => {
                        alert('Bid successfully created!');
                        setConvertingEmail(null);
                        // Trigger parent refresh if provided
                        if (onBidCreated) onBidCreated();
                    }}
                />
            )}
        </div>
    );
}
