'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RFPLane, RFPInvite } from '@/constants/types';
import { Loader2, DollarSign, Clock, MapPin, Building, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CarrierBiddingPage() {
    const params = useParams();
    const token = params.token as string;

    const [invite, setInvite] = useState<RFPInvite | null>(null);
    const [lanes, setLanes] = useState<RFPLane[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State to hold the bids input
    // Map of laneId -> Bid (rate, transit_time, notes)
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

        // Filter out rows where the carrier hasn't entered a rate
        const validBids = Object.entries(bidsData)
            .filter(([_, data]) => data.rate.trim() !== '' && !isNaN(Number(data.rate)))
            .map(([laneId, data]) => ({
                rfp_lane_id: laneId,
                rate: Number(data.rate),
                transit_time: data.transit_time,
                notes: data.notes
            }));

        if (validBids.length === 0) {
            alert('Please enter at least one valid numeric rate to submit.');
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
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <Loader2 className="animate-spin h-10 w-10" />
                    <p className="font-bold tracking-widest uppercase text-sm animate-pulse">Loading Bidding Portal...</p>
                </div>
            </div>
        );
    }

    // Error State (Invalid Token)
    if (error || !invite) {
        return (
            <div className="min-h-screen bg-transparent p-6 flex flex-col items-center justify-center">
                <div className="glass-panel p-10 rounded-3xl max-w-lg w-full text-center border border-red-500/20 shadow-2xl shadow-red-500/10">
                    <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MapPin size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-2">Access Denied</h2>
                    <p className="text-muted-foreground font-medium">{error || 'This bidding link is no longer valid or has expired.'}</p>
                </div>
            </div>
        );
    }

    // Success State
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-transparent p-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="glass-panel p-10 rounded-3xl max-w-lg w-full text-center border border-green-500/20 shadow-2xl shadow-green-500/10">
                    <div className="h-24 w-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-4">Bids Submitted!</h2>
                    <p className="text-muted-foreground font-medium mb-8">
                        Thank you for bidding securely via Shipera.AI. The shipper has received your rates and will contact you if selected.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => window.close()}>
                        Close Window
                    </Button>
                </div>
            </div>
        );
    }

    // Bidding UI
    const rfp = invite?.rfp;
    const carrier = invite?.carrier;

    if (!rfp || !carrier) {
        return (
            <div className="min-h-screen bg-transparent p-6 flex flex-col items-center justify-center">
                <div className="glass-panel p-10 rounded-3xl max-w-lg w-full text-center border border-red-500/20 shadow-2xl shadow-red-500/10">
                    <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MapPin size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-2">Incomplete Data</h2>
                    <p className="text-muted-foreground font-medium">We couldn&apos;t load the full bidding context. The RFP or carrier information is missing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Header Profile Bar */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between glass-panel px-6 py-4 border border-border/50 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                        <Building size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bidding As Carrier</p>
                        <p className="text-sm font-bold text-foreground">{carrier?.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Powered By</p>
                    <p className="text-sm font-black text-primary tracking-tight">Shipera.AI</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto space-y-8">

                {/* RFP Summary */}
                <div className="glass-panel p-8 rounded-3xl border border-border/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2 relative z-10">{rfp.title}</h1>

                    <div className="flex flex-wrap items-center gap-4 mt-6 text-xs font-bold text-muted-foreground relative z-10">
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-xl border border-border/50 uppercase">
                            <FileText size={14} className="text-primary" />
                            Mode: {rfp.mode?.replace(/_/g, ' ')}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 text-rose-500 rounded-xl border border-border/50 uppercase tracking-widest bg-rose-500/5">
                            <Clock size={14} />
                            Deadline: {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>

                    {rfp.notes && (
                        <div className="mt-8 border-l-2 border-primary pl-4 relative z-10">
                            <p className="text-sm font-medium text-muted-foreground italic">&quot; {rfp.notes} &quot;</p>
                        </div>
                    )}
                </div>

                {/* Bidding Lanes */}
                <div className="glass-panel p-8 rounded-3xl border border-border/50">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                            <DollarSign className="text-green-500" />
                            Submit Rates ({lanes.length} Lanes)
                        </h2>
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest hidden sm:inline-block">
                            Leave rates blank if declining to bid on specific lanes
                        </span>
                    </div>

                    <div className="space-y-4">
                        {lanes.map((lane) => (
                            <div key={lane.id} className="bg-background border border-border/50 p-6 rounded-2xl flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between hover:border-primary/20 transition-all shadow-sm">

                                {/* Lane Info */}
                                <div className="flex-1 w-full space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base font-black text-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" />
                                            <span>{lane.origin_city}, {lane.origin_state}</span>
                                        </div>
                                        <span className="text-muted-foreground hidden sm:inline">→</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-accent" />
                                            <span>{lane.destination_city}, {lane.destination_state}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-6">
                                        {lane.equipment_type && <span>Req: {lane.equipment_type}</span>}
                                        {lane.frequency && <span>Freq: {lane.frequency}</span>}
                                    </div>
                                </div>

                                {/* Interactive Bidding Fields */}
                                <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1 sm:w-32 group">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-green-500 transition-colors" />
                                        <input
                                            type="number"
                                            placeholder="Rate"
                                            className="w-full pl-9 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                                            value={bidsData[lane.id]?.rate || ''}
                                            onChange={(e) => handleInputChange(lane.id, 'rate', e.target.value)}
                                        />
                                    </div>

                                    <div className="relative flex-1 sm:w-40 group">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Transit (e.g. 2 Days)"
                                            className="w-full pl-9 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            value={bidsData[lane.id]?.transit_time || ''}
                                            onChange={(e) => handleInputChange(lane.id, 'transit_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 shrink-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="hidden sm:block">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Ready to commit?
                        </p>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        className="w-full sm:w-64 h-12 rounded-xl font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20"
                    >
                        Submit Bids
                    </Button>
                </div>
            </div>
        </div>
    );
}
