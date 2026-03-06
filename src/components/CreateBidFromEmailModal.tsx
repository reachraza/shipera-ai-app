'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RFPLane, InboundEmail } from '@/constants/types';
import { createBidFromAdmin } from '@/services/bidService';
import { createClient } from '@/config/supabase';
import { Loader2, AlertCircle, Wand2 } from 'lucide-react';

interface CreateBidFromEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: InboundEmail;
    onSuccess: () => void;
}

export default function CreateBidFromEmailModal({ isOpen, onClose, email, onSuccess }: CreateBidFromEmailModalProps) {
    const [lanes, setLanes] = useState<RFPLane[]>([]);
    const [loadingLanes, setLoadingLanes] = useState(false);

    // Form State
    const [selectedLaneId, setSelectedLaneId] = useState<string>('');
    const [rate, setRate] = useState<string>('');
    const [transitTime, setTransitTime] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill notes when opened
    useEffect(() => {
        if (isOpen && email) {
            setNotes(`Converted from Email: "${email.subject}"\n---\n${email.body_text?.substring(0, 200)}...`);

            // Only fetch lanes if we have an associated RFP
            if (email.rfp_id) {
                fetchLanes(email.rfp_id);
            }
        }
    }, [isOpen, email]);

    async function fetchLanes(rfpId: string) {
        setLoadingLanes(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('rfp_lanes')
                .select('*')
                .eq('rfp_id', rfpId);

            if (error) throw error;

            setLanes(data || []);
            if (data?.length === 1) {
                // Auto-select if there's only one lane
                setSelectedLaneId(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching lanes:', err);
        } finally {
            setLoadingLanes(false);
        }
    }

    async function handleAIExtract() {
        if (!email?.rfp_id) return;

        setIsExtracting(true);
        setError(null);

        try {
            const response = await fetch('/api/email/ai-extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailSubject: email.subject,
                    emailBody: email.body_text,
                    rfpId: email.rfp_id
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to extract with AI');
            }

            const { result } = await response.json();

            if (result) {
                if (result.laneId) setSelectedLaneId(result.laneId);
                if (result.rate) setRate(result.rate.toString());
                if (result.transitTime) setTransitTime(result.transitTime);
                if (result.notes) setNotes(prev => `${prev}\n\nAI Notes: ${result.notes}`);
            }
        } catch (err: any) {
            console.error('AI Extraction failed:', err);
            setError(err.message || 'AI Extraction failed. Please fill manually.');
        } finally {
            setIsExtracting(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!email.rfp_id || !email.matched_carrier_id) {
            setError('This email is not properly linked to a Carrier and RFP.');
            return;
        }

        if (!selectedLaneId || !rate || !transitTime) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createBidFromAdmin(
                email.rfp_id,
                email.matched_carrier_id,
                {
                    rfp_lane_id: selectedLaneId,
                    carrier_id: email.matched_carrier_id,
                    rate: parseFloat(rate),
                    transit_time: transitTime,
                    notes: notes,
                    status: 'pending'
                }
            );

            // Successfully created!
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to create bid:', err);
            setError(err.message || 'Failed to create bid.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!email) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Convert Email to Bid"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* AI Warning Banner */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">AI Manual Review Required</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                            The background AI was not confident enough to automatically convert this email into a bid.
                            Please review the text and manually enter the bid details below.
                        </p>
                    </div>
                </div>

                {/* Information Header & AI Button */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Creating bid on behalf of:</p>
                        <p className="font-bold text-base text-foreground">{email.from_name || email.from_email}</p>
                        <p className="text-xs text-muted-foreground break-all">{email.from_email}</p>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAIExtract}
                        disabled={isExtracting}
                        className="w-full sm:w-auto bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium"
                    >
                        {isExtracting ? (
                            <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                            <Wand2 size={14} className="mr-2" />
                        )}
                        Auto-Fill with AI
                    </Button>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-500 text-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Lane Selection */}
                    <div className="space-y-2">
                        <label htmlFor="lane" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Select Lane *</label>
                        <select
                            id="lane"
                            value={selectedLaneId}
                            onChange={(e) => setSelectedLaneId(e.target.value)}
                            disabled={loadingLanes || lanes.length === 0}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="">{loadingLanes ? 'Loading lanes...' : 'Select a lane'}</option>
                            {lanes.map(lane => (
                                <option key={lane.id} value={lane.id}>
                                    {lane.origin_city}, {lane.origin_state} → {lane.destination_city}, {lane.destination_state} ({lane.equipment_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Rate */}
                        <div className="space-y-2">
                            <label htmlFor="rate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Flat Rate ($) *</label>
                            <Input
                                id="rate"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="e.g. 1500"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Transit Time */}
                        <div className="space-y-2">
                            <label htmlFor="transitTime" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Transit Time *</label>
                            <Input
                                id="transitTime"
                                placeholder="e.g. 2 Days"
                                value={transitTime}
                                onChange={(e) => setTransitTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Carrier Notes</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px] font-mono text-xs"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !selectedLaneId || !rate || !transitTime}>
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" /> Creating Bid...
                            </>
                        ) : 'Create Official Bid'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
