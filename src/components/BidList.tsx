import { useEffect, useState } from 'react';
import { getBidsForRFP, acceptBid, acceptAllCarrierBids } from '@/services/bidService';
import { Loader2, DollarSign, Clock, MapPin, Building, Eye, ChevronRight, ChevronDown, CheckCircle2, XCircle, CheckSquare } from 'lucide-react';
import { Bid } from '@/constants/types';
import Pagination from '@/components/ui/Pagination';
import BidDetailsModal from './BidDetailsModal';
import BidAcceptanceModal from '@/components/ui/BidAcceptanceModal';

const ITEMS_PER_PAGE = 10;

interface BidListProps {
    rfpId: string;
}

export default function BidList({ rfpId }: BidListProps) {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
    const [expandedCarriers, setExpandedCarriers] = useState<Set<string>>(new Set());
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Acceptance Modal State
    const [acceptanceModal, setAcceptanceModal] = useState<{
        isOpen: boolean;
        type: 'single' | 'bulk';
        data: any;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'single',
        data: null,
        title: '',
        message: ''
    });

    useEffect(() => {
        loadBids();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rfpId]);

    async function loadBids() {
        try {
            setLoading(true);
            const data = await getBidsForRFP(rfpId);
            setBids(data);
        } catch (err) {
            console.error('Error loading bids:', err);
            setError('Failed to load bids.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAccept(bid: Bid) {
        setAcceptanceModal({
            isOpen: true,
            type: 'single',
            data: bid,
            title: 'Accept Individual Bid',
            message: `Are you sure you want to accept this bid from ${bid.carrier?.name}? Accepting this bid will mark it as the winner for this lane and automatically reject all other competing bids for this specific route.`
        });
    }

    async function handleAcceptAll(carrierId: string, carrierName: string) {
        setAcceptanceModal({
            isOpen: true,
            type: 'bulk',
            data: { carrierId, carrierName },
            title: 'Bulk Bid Award',
            message: `Are you sure you want to award ALL lanes to ${carrierName}? This will accept every lane they have bid on and simultaneously reject all other participating carriers for those lanes across the entire RFP.`
        });
    }

    async function processAcceptance() {
        try {
            if (acceptanceModal.type === 'single') {
                const bid = acceptanceModal.data as Bid;
                setProcessingId(bid.id);
                await acceptBid(bid.id, bid.rfp_lane_id);
            } else {
                const { carrierId } = acceptanceModal.data;
                setProcessingId(carrierId);
                await acceptAllCarrierBids(rfpId, carrierId);
            }
            setAcceptanceModal(prev => ({ ...prev, isOpen: false }));
            await loadBids();
        } catch (err: any) {
            alert(err.message || 'Failed to process acceptance');
        } finally {
            setProcessingId(null);
        }
    }

    const toggleCarrier = (carrierId: string) => {
        const newSet = new Set(expandedCarriers);
        if (newSet.has(carrierId)) newSet.delete(carrierId);
        else newSet.add(carrierId);
        setExpandedCarriers(newSet);
    };

    const [currentPage, setCurrentPage] = useState(1);

    // Grouping: Carrier ID -> { carrier, bids }
    const groupedByCarrier = bids.reduce((acc: Record<string, { carrier: any, bids: Bid[] }>, bid: Bid) => {
        const carrierId = bid.carrier_id;
        if (!acc[carrierId]) {
            acc[carrierId] = {
                carrier: bid.carrier,
                bids: []
            };
        }
        acc[carrierId].bids.push(bid);
        return acc;
    }, {});

    const carrierEntries = Object.entries(groupedByCarrier);
    const totalPages = Math.ceil(carrierEntries.length / ITEMS_PER_PAGE);
    const paginatedCarriers = carrierEntries.slice(
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
            <div className="space-y-3">
                {paginatedCarriers.map(([carrierId, data]) => {
                    const isExpanded = expandedCarriers.has(carrierId);
                    const bidCount = data.bids.length;
                    const acceptedCount = data.bids.filter(b => b.status === 'accepted').length;
                    const allAccepted = acceptedCount === bidCount;

                    return (
                        <div key={carrierId} className="glass-panel border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                            {/* Carrier Header */}
                            <div
                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => toggleCarrier(carrierId)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                                        <Building size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                                            {data.carrier?.name}
                                            {acceptedCount > 0 && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                    <CheckCircle2 size={10} /> {allAccepted ? 'All Awarded' : 'Partially Awarded'}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                            {bidCount} Lane{bidCount !== 1 ? 's' : ''} Submitted
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {!allAccepted && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAcceptAll(carrierId, data.carrier?.name);
                                            }}
                                            disabled={processingId === carrierId}
                                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50"
                                        >
                                            {processingId === carrierId ? <Loader2 size={12} className="animate-spin" /> : (
                                                <>
                                                    <CheckSquare size={12} />
                                                    Accept All Bids
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <div className="text-right hidden md:block">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Contact</p>
                                        <p className="text-xs font-bold text-foreground/70">{data.carrier?.contact_email}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Bids List (Expanded) */}
                            {isExpanded && (
                                <div className="border-t border-white/5 p-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[11px] text-left">
                                            <thead>
                                                <tr className="text-muted-foreground font-black uppercase tracking-widest border-b border-white/5">
                                                    <th className="px-4 py-3">Route / Lane</th>
                                                    <th className="px-4 py-3">Rate</th>
                                                    <th className="px-4 py-3">Transit</th>
                                                    <th className="px-4 py-3 text-right">Decision</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {data.bids.map((bid) => (
                                                    <tr key={bid.id} className="group hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <MapPin size={12} className="text-primary opacity-50" />
                                                                <div className="font-bold whitespace-nowrap">
                                                                    {bid.lane?.origin_city}, {bid.lane?.origin_state} <span className="text-muted-foreground mx-1">→</span> {bid.lane?.destination_city}, {bid.lane?.destination_state}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-1.5 font-black text-green-500">
                                                                <DollarSign size={12} />
                                                                {Number(bid.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 font-bold text-muted-foreground">
                                                            {bid.transit_time}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedBid(bid);
                                                                    }}
                                                                    className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-muted-foreground transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>

                                                                {bid.status === 'accepted' ? (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                                        <CheckCircle2 size={12} /> Accepted
                                                                    </div>
                                                                ) : bid.status === 'rejected' ? (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                                        <XCircle size={12} /> Rejected
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleAccept(bid);
                                                                        }}
                                                                        disabled={processingId === bid.id}
                                                                        className="h-8 px-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                                                                    >
                                                                        {processingId === bid.id ? <Loader2 size={12} className="animate-spin" /> : 'Accept Bid'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {carrierEntries.length > ITEMS_PER_PAGE && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={carrierEntries.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </div>
            )}

            {selectedBid && (
                <BidDetailsModal bid={selectedBid} onClose={() => setSelectedBid(null)} />
            )}

            <BidAcceptanceModal
                isOpen={acceptanceModal.isOpen}
                onClose={() => setAcceptanceModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={processAcceptance}
                title={acceptanceModal.title}
                message={acceptanceModal.message}
                isLoading={processingId !== null}
                confirmText={acceptanceModal.type === 'bulk' ? "Award All Lanes" : "Accept Bid"}
            />
        </>
    );
}
