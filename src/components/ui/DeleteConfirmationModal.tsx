'use client';

import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-card/95 border border-red-500/20 shadow-2xl shadow-red-500/10 rounded-[32px] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Dramatic top border glow */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

                {/* Background ambient glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 sm:p-10 relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl animate-pulse group-hover:bg-red-500/30 transition-all" />
                            <div className="relative h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <AlertTriangle size={32} strokeWidth={2.5} />
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-none">
                            {title}
                        </h3>
                        <div className="h-px w-12 bg-red-500/30 rounded-full" />
                        <p className="text-muted-foreground font-medium text-sm leading-relaxed pt-2">
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
                            className="flex-1 font-black uppercase tracking-widest text-[10px] py-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transform hover:-translate-y-1 active:translate-y-0 transition-all"
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
