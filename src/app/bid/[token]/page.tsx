'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RFPLane, RFPInvite } from '@/constants/types';
import {
    Loader2,
    DollarSign,
    Clock,
    MapPin,
    Building,
    FileText,
    CheckCircle2,
    ArrowRight,
    Truck,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CarrierBiddingPage() {
    const params = useParams();
    const token = params.token as string;

    const [invite, setInvite] = useState<RFPInvite | null>(null);
    const [lanes, setLanes] = useState<RFPLane[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State to hold the bids input
    const [bidsData, setBidsData] = useState<Record<string, { rate: string, transit_time: string, notes: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        async function loadBiddingContext() {
            try {
                const res = await fetch(`/api/bid/${token}`);
                if (!res.ok) {
                    throw new Error('Invalid or expired bidding link.');
                }
                const data = await res.json();
                setInvite(data.invite);
                setLanes(data.lanes);

                // Initialize empty bid form data
                const initialMap: Record<string, { rate: string, transit_time: string, notes: string }> = {};
                data.lanes.forEach((lane: RFPLane) => {
                    initialMap[lane.id] = { rate: '', transit_time: '', notes: '' };
                });
                setBidsData(initialMap);

            } catch (err) {
                const error = err as Error;
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (token) loadBiddingContext();
    }, [token]);

    const handleInputChange = (laneId: string, field: string, value: string) => {
        setBidsData(prev => ({
            ...prev,
            [laneId]: {
                ...prev[laneId],
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        if (!invite) return;

        // Filter out rows where the carrier hasn't entered a rate or rate is non-positive
        const validBids = Object.entries(bidsData)
            .filter(([_, data]) => {
                const rateNum = Number(data.rate);
                return data.rate.trim() !== '' && !isNaN(rateNum) && rateNum > 0;
            })
            .map(([laneId, data]) => ({
                rfp_lane_id: laneId,
                rate: Number(data.rate),
                transit_time: data.transit_time,
                notes: data.notes
            }));

        if (validBids.length === 0) {
            alert('Please enter at least one valid positive rate to submit.');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/bid/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bids: validBids })
            });

            if (!res.ok) {
                throw new Error('Failed to submit bids. Please try again.');
            }

            setIsSuccess(true);
        } catch (err) {
            const error = err as Error;
            console.error(error);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        <Loader2 className="animate-spin h-8 w-8 text-primary relative z-10" />
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="font-black tracking-[0.15em] uppercase text-[10px] text-primary animate-pulse">Initializing</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error State (Invalid Token)
    if (error || !invite) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] p-6 flex flex-col items-center justify-center">
                <div className="max-w-sm w-full glass-panel p-8 rounded-2xl text-center border-red-500/20 relative group">
                    <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-foreground mb-2 tracking-tight">Access Restricted</h2>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                        {error || 'This link has expired or reached its access limit.'}
                    </p>
                </div>
            </div>
        );
    }

    // Success State
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] p-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full glass-panel p-10 rounded-[2rem] text-center border-green-500/20 animate-in zoom-in-95 duration-700 relative overflow-hidden">
                    <div className="h-20 w-20 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/10">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-3 tracking-tighter">Bids Transmitted</h2>
                    <p className="text-base text-muted-foreground font-medium mb-8 leading-relaxed">
                        Your strategic rates have been securely transmitted to the shipper.
                    </p>
                    <Button
                        variant="outline"
                        className="w-full h-12 text-sm rounded-xl border-white/5 bg-white/5 hover:bg-white/10 transition-all font-bold"
                        onClick={() => window.close()}
                    >
                        Return to Workspace
                    </Button>
                </div>
            </div>
        );
    }

    const rfp = invite?.rfp;
    const carrier = invite?.carrier;

    return (
        <div className="min-h-screen bg-[#050505] text-foreground relative overflow-hidden selection:bg-primary/30 font-sans">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">

                {/* Header Profile Section */}
                <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 animate-in fade-in slide-in-from-top-2 duration-700">
                    <div className="flex items-center gap-4 group">
                        <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-all duration-500">
                            <Building size={24} className="text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black tracking-widest text-primary uppercase">
                                Secure Session
                            </div>
                            <h2 className="text-lg font-black tracking-tight leading-tight">{carrier?.name}</h2>
                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest italic">{carrier?.email}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Powered By</span>
                        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40 tracking-tighter italic">Shipera.AI</h1>
                    </div>
                </header>

                <main className="space-y-8">

                    {/* Proposal Summary Card */}
                    <section className="glass-panel p-8 md:p-10 rounded-[1.5rem] border-white/5 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
                            <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">RFP Proposal</h3>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight">{rfp?.title}</h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70">
                                        <Truck size={14} className="text-primary" />
                                        {rfp?.mode?.replace(/_/g, ' ')}
                                    </div>
                                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                                        <Calendar size={14} />
                                        {rfp?.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'Immediate'}
                                    </div>
                                </div>
                            </div>

                            {rfp?.notes && (
                                <div className="max-w-xs p-4 bg-white/5 border border-white/10 rounded-2xl relative backdrop-blur-xl">
                                    <p className="text-[11px] leading-relaxed text-muted-foreground italic font-medium">
                                        &quot;{rfp.notes}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Bidding Grid */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                                <span className="h-1.5 w-6 bg-primary rounded-full" />
                                Route Network
                            </h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                                <span className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{lanes.length} Lanes</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {lanes.map((lane, index) => (
                                <div
                                    key={lane.id}
                                    className="group glass-panel border-white/5 hover:border-primary/20 p-5 md:p-6 rounded-2xl transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Lane Visualizer */}
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="space-y-0.5 min-w-[120px]">
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Origin</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={14} className="text-primary shrink-0" />
                                                        <span className="text-sm font-black whitespace-nowrap">{lane.origin_city}, {lane.origin_state}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 px-2 flex items-center opacity-30">
                                                    <div className="h-[1px] w-full bg-gradient-to-r from-primary to-accent relative">
                                                        <ArrowRight size={12} className="absolute right-0 -top-[5.5px] text-accent" />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5 text-right min-w-[120px]">
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Destination</p>
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <span className="text-sm font-black whitespace-nowrap">{lane.destination_city}, {lane.destination_state}</span>
                                                        <MapPin size={14} className="text-accent shrink-0" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {lane.equipment_type && (
                                                    <span className="px-2.5 py-0.5 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                        {lane.equipment_type}
                                                    </span>
                                                )}
                                                {lane.frequency && (
                                                    <span className="px-2.5 py-0.5 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                        Freq: {lane.frequency}
                                                    </span>
                                                )}
                                                {lane.total_hours && (
                                                    <span className="px-2.5 py-0.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                                        Hrs: {lane.total_hours}
                                                    </span>
                                                )}
                                                {lane.total_time && (
                                                    <span className="px-2.5 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-400">
                                                        Time: {lane.total_time}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        <div className="flex flex-row gap-2 items-center p-1.5 bg-white/5 rounded-xl border border-white/5 focus-within:border-primary/40 transition-all duration-300">
                                            <div className="relative flex-1 md:w-24">
                                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-500/50" size={12} />
                                                <input
                                                    type="number"
                                                    placeholder="Rate"
                                                    min="0.01"
                                                    step="0.01"
                                                    className="w-full h-9 pl-7 pr-2 bg-transparent border-none text-xs font-black focus:ring-0 placeholder:text-muted-foreground/30"
                                                    value={bidsData[lane.id]?.rate || ''}
                                                    onChange={(e) => handleInputChange(lane.id, 'rate', e.target.value)}
                                                />
                                            </div>
                                            <div className="h-4 w-[1px] bg-white/10" />
                                            <div className="relative flex-1 md:w-28">
                                                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/50" size={12} />
                                                <input
                                                    type="text"
                                                    placeholder="Transit"
                                                    className="w-full h-9 pl-7 pr-2 bg-transparent border-none text-[10px] font-bold focus:ring-0 placeholder:text-muted-foreground/30"
                                                    value={bidsData[lane.id]?.transit_time || ''}
                                                    onChange={(e) => handleInputChange(lane.id, 'transit_time', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="relative group/notes">
                                            <FileText className="absolute left-3 top-2.5 text-muted-foreground/30 group-focus-within/notes:text-primary/50 transition-colors" size={12} />
                                            <textarea
                                                placeholder="Add lane specifics or details..."
                                                className="w-full min-h-[60px] md:w-56 p-2 pl-8 bg-white/5 border border-white/5 rounded-xl text-[10px] font-medium focus:outline-none focus:border-primary/30 transition-all resize-none placeholder:text-muted-foreground/20 leading-relaxed"
                                                value={bidsData[lane.id]?.notes || ''}
                                                onChange={(e) => handleInputChange(lane.id, 'notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Premium Sticky Footer Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-[100] bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent backdrop-blur-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-2">
                    <div className="hidden sm:block">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Final Transmission</p>
                        <p className="text-xs font-bold text-muted-foreground/60">Review your rates before submission.</p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        className="w-full sm:w-60 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.1em] text-[11px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Submit All Rates
                    </Button>
                </div>
            </div>
        </div>
    );
}
