'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children
}: ModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-10000 w-screen h-screen flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-card/95 border border-border shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h3 className="text-xl font-bold text-foreground">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground/60 hover:text-foreground bg-muted/30 hover:bg-muted/80 rounded-xl transition-all border border-transparent hover:border-border/50 backdrop-blur-sm cursor-pointer"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
