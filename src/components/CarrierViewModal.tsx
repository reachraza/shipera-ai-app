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
    Calendar,
    MapPin,
    Trash2,
    Edit2
} from 'lucide-react';

interface CarrierViewModalProps {
    carrier: Carrier;
    onClose: () => void;
    onDelete?: (carrier: Carrier) => void;
    onEdit?: (carrier: Carrier) => void;
}

export default function CarrierViewModal({ carrier, onClose, onDelete, onEdit }: CarrierViewModalProps) {
    const statusInfo = CARRIER_STATUSES.find((s) => s.value === carrier.status);
    const StatusIcon =
        carrier.status === 'approved' ? ShieldCheck :
            carrier.status === 'suspended' ? AlertCircle : Clock;

    const statusColor =
        carrier.status === 'approved' ? 'bg-primary/10 text-primary border-primary/20' :
            carrier.status === 'suspended' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-foreground">
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
                            <h2 className="text-2xl font-extrabold tracking-tight">{carrier.name}</h2>
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
                <div className="p-6 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto">

                    {/* Contact & Compliance Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Left Column: Contact & Core Compliance */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Contact Info</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail size={16} className="text-muted-foreground" />
                                        <p className="text-sm font-semibold">{carrier.email || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-muted-foreground" />
                                        <p className="text-sm font-semibold">{carrier.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Compliance</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Hash size={16} className="text-muted-foreground" />
                                        <div className="flex flex-wrap gap-2">
                                            {carrier.mc_number && (
                                                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">MC: {carrier.mc_number}</span>
                                            )}
                                            {carrier.dot_number && (
                                                <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">DOT: {carrier.dot_number}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Insurance Expiry</p>
                                            <p className="text-sm font-semibold">{carrier.insurance_expiration ? new Date(carrier.insurance_expiration).toLocaleDateString() : 'Not Set'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: FMCSA Verified Data */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/20 pb-2 flex items-center gap-2">
                                <ShieldCheck size={16} /> FMCSA Verified
                            </h3>
                            {carrier.fmcsa_data ? (
                                <div className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Legal Name</p>
                                        <p className="text-sm font-black">{carrier.fmcsa_data.legal_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Status</p>
                                        <p className={`text-xs font-bold ${carrier.fmcsa_data.allowed_to_operate === 'Y' ? 'text-green-500' : 'text-red-500'}`}>
                                            {carrier.fmcsa_data.allowed_to_operate === 'Y' ? 'Authorized' : 'Unauthorized'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Power Units</p>
                                            <p className="text-xs font-bold">{carrier.fmcsa_data.raw_data?.totalPowerUnits || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Total Drivers</p>
                                            <p className="text-xs font-bold">{carrier.fmcsa_data.raw_data?.totalDrivers || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 pt-2 border-t border-primary/10">
                                        <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                                        <div className="text-[11px] leading-tight">
                                            <p className="font-bold">{carrier.fmcsa_data.street}</p>
                                            <p className="text-muted-foreground">{carrier.fmcsa_data.city}, {carrier.fmcsa_data.state} {carrier.fmcsa_data.zip}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-muted/20 p-6 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center h-full min-h-[160px]">
                                    <AlertCircle className="text-muted-foreground/30 mb-2" size={24} />
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No FMCSA Data</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 px-4">Registry verification pending or not available.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Equipment Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Equipment Profile</h3>
                        <div className="flex flex-wrap gap-2">
                            {carrier.equipment_types && carrier.equipment_types.length > 0 ? (
                                carrier.equipment_types.map((type) => (
                                    <span
                                        key={type}
                                        className="px-4 py-2 bg-muted/50 border border-border rounded-xl text-xs font-bold uppercase tracking-wider"
                                    >
                                        {type}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic px-2">No equipment types specified.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-muted/20 border-t border-border flex justify-between items-center">
                    {onDelete ? (
                        <button
                            onClick={() => {
                                onDelete(carrier);
                                onClose();
                            }}
                            className="px-4 py-2.5 text-red-500 hover:bg-red-500/10 font-bold rounded-xl transition-all flex items-center gap-2 group"
                        >
                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                            Delete Carrier
                        </button>
                    ) : <div />}
                    <div className="flex gap-3">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onEdit(carrier);
                                    onClose();
                                }}
                                className="px-6 py-3 bg-muted text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-border"
                            >
                                <Edit2 size={16} />
                                Modify Profile
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25"
                        >
                            Close Portal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
