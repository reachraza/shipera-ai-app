import React from 'react';
import { Carrier } from '@/constants/types';
import { CARRIER_STATUSES } from '@/constants/statuses';
import {
    X,
    Truck,
    Mail,
    Phone,
    Hash,
    ShieldCheck,
    AlertCircle,
    Clock,
    Calendar
} from 'lucide-react';

interface CarrierViewModalProps {
    carrier: Carrier;
    onClose: () => void;
}

export default function CarrierViewModal({ carrier, onClose }: CarrierViewModalProps) {
    const statusInfo = CARRIER_STATUSES.find((s) => s.value === carrier.status);
    const StatusIcon =
        carrier.status === 'approved' ? ShieldCheck :
            carrier.status === 'suspended' ? AlertCircle : Clock;

    const statusColor =
        carrier.status === 'approved' ? 'bg-primary/10 text-primary border-primary/20' :
            carrier.status === 'suspended' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

                {/* Header */}
                <div className="flex items-start justify-between p-6 sm:p-8 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Truck size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{carrier.name}</h2>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${statusColor}`}>
                                    <StatusIcon size={14} />
                                    {statusInfo?.label || carrier.status}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded-lg">
                                    Added {new Date(carrier.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-8">

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Contact Info</h3>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Email</p>
                                    <p className="text-sm font-semibold text-foreground">{carrier.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Phone</p>
                                    <p className="text-sm font-semibold text-foreground">{carrier.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Compliance */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Compliance</h3>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                    <Hash size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">MC / DOT Number</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {carrier.mc_number && (
                                            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">MC: {carrier.mc_number}</span>
                                        )}
                                        {carrier.dot_number && (
                                            <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">DOT: {carrier.dot_number}</span>
                                        )}
                                        {!carrier.mc_number && !carrier.dot_number && <span className="text-sm font-semibold text-foreground">N/A</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Insurance Expiry</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {carrier.insurance_expiration ? new Date(carrier.insurance_expiration).toLocaleDateString() : 'Not Set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Equipment Profile */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Equipment Profile</h3>
                        <div className="flex flex-wrap gap-2">
                            {carrier.equipment_types && carrier.equipment_types.length > 0 ? (
                                carrier.equipment_types.map((type) => (
                                    <span
                                        key={type}
                                        className="px-4 py-2 bg-muted/50 border border-border text-foreground rounded-xl text-xs font-bold shadow-sm uppercase tracking-wider"
                                    >
                                        {type}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No equipment types specified.</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
