import { Carrier } from '@/constants/types';
import { X, Mail, Phone, MapPin, Hash, ShieldCheck, Truck, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CarrierDetailsModalProps {
    carrier: Carrier;
    onClose: () => void;
    isSelected?: boolean;
    onToggleSelection?: () => void;
    onDelete?: (carrier: Carrier) => void;
}

export default function CarrierDetailsModal({
    carrier,
    onClose,
    isSelected = false,
    onToggleSelection,
    onDelete
}: CarrierDetailsModalProps) {
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                    <div>
                        <h2 className="text-xl font-black text-foreground">{carrier.name}</h2>
                        {carrier.fmcsa_data?.legal_name && carrier.fmcsa_data.legal_name !== carrier.name && (
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                FMCSA Legal: {carrier.fmcsa_data.legal_name}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${carrier.status === 'approved' ? 'bg-primary/20 text-primary' :
                                carrier.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                                    'bg-accent/20 text-accent'
                                }`}>
                                {carrier.status}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Mail size={14} /> Contact Information
                        </h3>
                        <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/50">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={16} className="text-muted-foreground shrink-0" />
                                <span className="font-medium">{carrier.email || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={16} className="text-muted-foreground shrink-0" />
                                <span className="font-medium">{carrier.phone || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* FMCSA Registry Info */}
                    {carrier.fmcsa_data && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> FMCSA Registry Data
                            </h3>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Operation Status</p>
                                    <p className="text-xs font-black text-primary">{carrier.fmcsa_data.allowed_to_operate === 'Y' ? 'Authorized' : 'Not Authorized'}</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-foreground">{carrier.fmcsa_data.street}</p>
                                        <p className="text-muted-foreground">{carrier.fmcsa_data.city}, {carrier.fmcsa_data.state} {carrier.fmcsa_data.zip}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Registration Info */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} /> Compliance & Registration
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">MC Number</p>
                                <p className="font-mono text-sm font-bold">{carrier.mc_number ? `MC-${carrier.mc_number}` : 'N/A'}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">DOT Number</p>
                                <p className="font-mono text-sm font-bold">{carrier.dot_number ? `DOT-${carrier.dot_number}` : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Truck size={14} /> Equipment Types
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {carrier.equipment_types && carrier.equipment_types.length > 0 ? (
                                carrier.equipment_types.map((eq: string) => (
                                    <span key={eq} className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs font-bold text-foreground">
                                        {eq}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground italic">No equipment profiles listed</span>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer (Optional Selection Action) */}
                <div className="p-6 border-t border-border bg-muted/10 flex flex-col gap-3">
                    {onToggleSelection && (
                        <Button
                            className="w-full font-bold uppercase tracking-widest text-xs py-6"
                            variant={isSelected ? "outline" : "primary"}
                            onClick={() => {
                                onToggleSelection();
                                onClose(); // Optionally auto-close the modal after selecting
                            }}
                        >
                            {isSelected ? (
                                <>
                                    <CheckCircle2 size={16} className="mr-2 text-primary" />
                                    Carrier Selected (Click to Remove)
                                </>
                            ) : (
                                <>
                                    <Circle size={16} className="mr-2 opacity-50" />
                                    Select Carrier for Invite
                                </>
                            )}
                        </Button>
                    )}

                    {onDelete && (
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:bg-red-500/10 font-bold uppercase tracking-widest text-[10px] py-4 flex items-center justify-center gap-2"
                            onClick={() => {
                                onDelete(carrier);
                                onClose();
                            }}
                        >
                            <Trash2 size={14} />
                            Remove from Network
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
