'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRFP } from '@/services/rfpService';
import { getLanesByRFP } from '@/services/laneService';
import { getInvitesByRFP } from '@/services/inviteService';
import { RFP, RFPLane, RFPInvite } from '@/constants/types';
import LaneTable from '@/components/LaneTable';
import CSVUpload from '@/components/CSVUpload';
import CarrierSelect from '@/components/CarrierSelect';
import InviteTable from '@/components/InviteTable';
import { RFP_STATUSES } from '@/constants/statuses';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Truck, 
  UserPlus, 
  Layers, 
  Clock,
  Loader2
} from 'lucide-react';

export default function RFPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;
  const [rfp, setRFP] = useState<RFP | null>(null);
  const [lanes, setLanes] = useState<RFPLane[]>([]);
  const [invites, setInvites] = useState<RFPInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfpId]);

  async function loadData() {
    try {
      const [rfpData, lanesData, invitesData] = await Promise.all([
        getRFP(rfpId),
        getLanesByRFP(rfpId),
        getInvitesByRFP(rfpId),
      ]);
      setRFP(rfpData);
      setLanes(lanesData);
      setInvites(invitesData);
    } catch (err) {
      console.error('Error loading RFP data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-muted-foreground font-medium">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="animate-pulse">Loading RFP Details...</p>
        </div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="text-center py-20 glass-panel rounded-3xl">
        <div className="inline-flex h-20 w-20 rounded-3xl bg-muted items-center justify-center mb-6 text-muted-foreground">
           <FileText size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-foreground">RFP Not Found</h2>
        <p className="text-muted-foreground mt-2 font-medium">The requested tender does not exist or you don't have permission.</p>
        <button 
          onClick={() => router.push('/rfps')}
          className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all active:scale-95"
        >
          Return to RFPs
        </button>
      </div>
    );
  }

  const statusInfo = RFP_STATUSES.find((s) => s.value === rfp.status);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <button 
          onClick={() => router.push('/rfps')}
          className="group text-sm font-black text-muted-foreground hover:text-primary flex items-center gap-2 transition-all w-fit uppercase tracking-widest"
       >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to list
       </button>

      {/* RFP Header */}
      <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden border border-border/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                 <FileText size={24} />
              </div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">{rfp.title}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-xl border border-border/50">
                <Truck size={14} className="text-primary" />
                <span>{rfp.mode?.replace(/_/g, ' ')}</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-xl border border-border/50">
                <Calendar size={14} className="text-accent" />
                Deadline: {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : 'Not set'}
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-xl border border-border/50">
                 <Clock size={14} className="text-amber-500" />
                 Created: {new Date(rfp.created_at).toLocaleDateString()}
              </span>
            </div>
            {rfp.notes && (
              <div className="mt-8 relative group">
                <div className="absolute -left-4 top-0 w-1 h-full bg-border group-hover:bg-primary transition-colors" />
                <p className="text-foreground/80 text-sm font-medium leading-relaxed italic">
                  "{rfp.notes}"
                </p>
              </div>
            )}
          </div>
          <span
            className="px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] text-white shadow-xl self-start whitespace-nowrap shadow-primary/10 uppercase"
            style={{ backgroundColor: statusInfo?.color || '#94a3b8' }}
          >
            {statusInfo?.label || rfp.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Lanes Section */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 xl:col-span-2 flex flex-col border border-border/50">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
               <Layers size={24} className="text-primary" />
               Freight Lanes
            </h2>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
              {lanes.length} Total
            </span>
          </div>
          <div className="mb-8">
             <CSVUpload rfpId={rfpId} onUploaded={loadData} />
          </div>
          <div className="border border-border/50 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
            <LaneTable lanes={lanes} />
          </div>
        </div>

        {/* Carrier Invites Section */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 flex flex-col border border-border/50">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
               <UserPlus size={24} className="text-accent" />
               Invites
            </h2>
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
              {invites.length} Sent
            </span>
          </div>
          <div className="mb-8">
             <CarrierSelect rfpId={rfpId} existingInvites={invites} onInvited={loadData} />
          </div>
          <div className="border border-border/50 rounded-2xl overflow-hidden shadow-2xl shadow-accent/5">
            <InviteTable invites={invites} />
          </div>
        </div>
      </div>
    </div>
  );
}
