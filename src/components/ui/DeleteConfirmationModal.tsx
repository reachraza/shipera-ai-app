'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] w-screen h-screen flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-card/95 border border-red-500/20 shadow-2xl shadow-red-500/10 rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Dramatic top border glow */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

                {/* Background ambient glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 sm:p-10 relative z-10 flex flex-col items-center text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 text-muted-foreground/60 hover:text-foreground bg-muted/30 hover:bg-muted/80 rounded-2xl transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-border/50 backdrop-blur-sm"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    <div className="mb-8 mt-2">
                        <div className="relative group mx-auto">
                            <div className="absolute inset-0 bg-red-500/20 rounded-[28px] blur-2xl animate-pulse group-hover:bg-red-500/40 transition-all duration-700" />
                            <div className="relative h-20 w-20 rounded-[28px] bg-gradient-to-br from-card to-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_8px_32px_-8px_rgba(239,68,68,0.3)] inset-0 group-hover:scale-110 transition-transform duration-500">
                                <AlertTriangle size={36} strokeWidth={2} className="relative z-10" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col items-center">
                        <h3 className="text-2xl sm:text-[28px] font-black text-foreground tracking-tight leading-tight">
                            {title}
                        </h3>
                        <div className="h-1 w-12 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 rounded-full" />
                        <p className="text-muted-foreground font-medium text-[15px] leading-relaxed max-w-[280px] mx-auto">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-4 mt-12 w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 font-bold text-sm py-6 rounded-2xl bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 hover:border-border transition-all duration-300"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirm}
                            isLoading={isLoading}
                            className="flex-1 font-black leading-none tracking-wide text-sm py-6 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_-15px_rgba(239,68,68,0.6)] border border-red-400/20 transition-all duration-300 transform hover:-translate-y-[2px] active:translate-y-[1px]"
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
