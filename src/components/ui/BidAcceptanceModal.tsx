'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BidAcceptanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
    confirmText?: string;
}

export default function BidAcceptanceModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
    confirmText = "Confirm Acceptance"
}: BidAcceptanceModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] w-screen h-screen flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-card/95 border border-green-500/20 shadow-2xl shadow-green-500/10 rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
                {/* Dramatic top border glow */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500" />

                {/* Background ambient glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 sm:p-10 relative z-10 flex flex-col items-center text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>

                    <div className="mb-8">
                        <div className="relative group mx-auto">
                            <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl animate-pulse group-hover:bg-green-500/30 transition-all" />
                            <div className="relative h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={32} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 flex flex-col items-center">
                        <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                            {title}
                        </h3>
                        <div className="h-px w-12 bg-green-500/30 rounded-full" />
                        <p className="text-muted-foreground font-medium text-sm leading-relaxed pt-2 max-w-xs mx-auto">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-10 pt-6 border-t border-border/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 font-bold uppercase tracking-widest text-[10px] py-6 rounded-2xl border border-transparent hover:bg-muted hover:border-border/50 transition-all"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirm}
                            isLoading={isLoading}
                            className="flex-1 font-black uppercase tracking-widest text-[10px] py-6 rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transform hover:-translate-y-1 active:translate-y-0 transition-all"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
