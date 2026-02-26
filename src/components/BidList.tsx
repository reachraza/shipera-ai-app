'use client';

import { useEffect, useState } from 'react';
import { getBidsForRFP } from '@/services/bidService';
import { Loader2, DollarSign, Clock, MapPin, Building } from 'lucide-react';
import { Bid } from '@/constants/types';
import Pagination from '@/components/ui/Pagination';

const ITEMS_PER_PAGE = 10;

interface BidListProps {
    rfpId: string;
}

export default function BidList({ rfpId }: BidListProps) {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadBids();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rfpId]);

    async function loadBids() {
        try {
            setLoading(true);
            const data = await getBidsForRFP(rfpId);
            // Group bids by Lane for easier viewing
            setBids(data);
        } catch (err) {
            console.error('Error loading bids:', err);
            setError('Failed to load bids.');
        } finally {
            setLoading(false);
        }
    }

    const [currentPage, setCurrentPage] = useState(1);

    // Create a map of Lane ID -> Bids
    const bidsByLane = bids.reduce((acc, bid) => {
        const laneId = bid.lane?.id;
        if (!laneId) return acc;
        if (!acc[laneId]) acc[laneId] = [];
        acc[laneId].push(bid);
        return acc;
    }, {} as Record<string, Bid[]>);

    const laneEntries = Object.entries(bidsByLane);
    const totalPages = Math.ceil(laneEntries.length / ITEMS_PER_PAGE);
    const paginatedLaneEntries = laneEntries.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="font-medium animate-pulse">Fetching submitted bids...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium text-center">
                {error}
            </div>
        );
    }

    if (bids.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/30 border border-border rounded-2xl">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No Bids Yet</h3>
                <p className="text-muted-foreground text-sm font-medium mt-1">
                    Carriers have not submitted any bids for this RFP. Check their invite status for updates!
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {paginatedLaneEntries.map(([laneId, laneBids]) => {
                    const lane = laneBids[0].lane;
                    if (!lane) return null;

                    return (
                        <div key={laneId} className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                            {/* Lane Header */}
                            <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MapPin className="text-primary h-5 w-5 shrink-0" />
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm font-bold text-foreground">
                                        <span>{lane.origin_city}, {lane.origin_state}</span>
                                        <span className="text-muted-foreground hidden sm:inline">→</span>
                                        <span>{lane.destination_city}, {lane.destination_state}</span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-background border border-border text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {laneBids.length} Bid{laneBids.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Bids Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-background border-b border-border/50">
                                            <th className="px-4 py-3 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Carrier</th>
                                            <th className="px-4 py-3 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Rate</th>
                                            <th className="px-4 py-3 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Transit Mode/Time</th>
                                            <th className="px-4 py-3 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {[...laneBids].sort((a, b) => a.rate - b.rate).map((bid) => (
                                            <tr key={bid.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-accent" />
                                                        <span className="font-bold text-foreground">{bid.carrier?.name || 'Unknown Carrier'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 font-black text-green-600 dark:text-green-500">
                                                    ${Number(bid.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3.5 text-muted-foreground font-medium flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4 opacity-70" />
                                                    {bid.transit_time || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium">
                                                    {new Date(bid.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={laneEntries.length}
                itemsPerPage={ITEMS_PER_PAGE}
            />
        </>
    );
}
