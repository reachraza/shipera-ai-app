'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bid } from '@/constants/types';
import {
    X,
    Building,
    DollarSign,
    Clock,
    FileText,
    MapPin,
    Truck,
    Phone,
    Mail,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Button } from './ui/Button';

interface BidDetailsModalProps {
    bid: Bid;
    onClose: () => void;
}

export default function BidDetailsModal({ bid, onClose }: BidDetailsModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!bid || !mounted) return null;

    const lane = bid.lane;
    const carrier = bid.carrier;

    return createPortal(
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="relative p-8 border-b border-white/10">
                    <div className="absolute top-0 right-0 p-6">
                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-muted-foreground" />
                        </button>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-2xl shadow-primary/5">
                            <Building size={32} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tighter capitalize">{carrier?.name}</h2>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {carrier?.email}</span>
                                <span className="flex items-center gap-1.5"><Phone size={14} /> {carrier?.phone}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">

                    {/* Lane Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-8 bg-primary rounded-full" />
                            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Lane Operational Logistics</h3>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between">
                            <div className="space-y-1.5 flex-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Origin</p>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-primary" />
                                    <span className="text-xl font-black">{lane?.origin_city}, {lane?.origin_state}</span>
                                </div>
                            </div>

                            <div className="px-8 opacity-20">
                                <ArrowRight size={24} />
                            </div>

                            <div className="space-y-1.5 flex-1 text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xl font-black">{lane?.destination_city}, {lane?.destination_state}</span>
                                    <MapPin size={16} className="text-accent" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial & Transit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-500/5 border border-green-500/10 rounded-3xl p-6 space-y-2">
                            <div className="flex items-center gap-2 text-green-500/50">
                                <DollarSign size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Submitted Rate</span>
                            </div>
                            <p className="text-3xl font-black text-green-500">
                                ${Number(bid.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 space-y-2">
                            <div className="flex items-center gap-2 text-primary/50">
                                <Clock size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Transit Profile</span>
                            </div>
                            <p className="text-3xl font-black text-primary uppercase">
                                {bid.transit_time || 'Express'}
                            </p>
                        </div>
                    </div>

                    {/* Bidder Details (Notes) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1 text-muted-foreground/40">
                            <FileText size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Bidder Specification Notes</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
                            <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
                                &quot;{bid.notes || 'No operational specifics provided for this lane.'}&quot;
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="h-12 px-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold"
                    >
                        Close Specification
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
