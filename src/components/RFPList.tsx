'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RFP } from '@/constants/types';
import { RFP_STATUSES } from '@/constants/statuses';
import { getRFPs } from '@/services/rfpService';
import { useAuth } from '@/hooks/useAuth';
import {
  FileText,
  Clock,
  Truck,
  ArrowRight,
  Loader2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  MoreVertical
} from 'lucide-react';

export default function RFPList({ searchQuery = '', statusFilter = 'all' }: { searchQuery?: string; statusFilter?: string }) {

  const { orgId, loading: authLoading } = useAuth();
  const [rfps, setRFPs] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (orgId) {
        loadRFPs();
      } else {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, authLoading]);

  async function loadRFPs() {
    if (!orgId) return;
    try {
      const data = await getRFPs(orgId);
      setRFPs(data);
    } catch (err) {
      console.error('Error loading RFPs:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground font-medium">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="animate-pulse">Loading active tender list...</p>
        </div>
      </div>
    );
  }

  const filteredRFPs = rfps.filter((rfp) => {
    const matchesSearch =
      rfp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfp.mode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfp.notes && rfp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || rfp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (rfps.length === 0) {

    return (
      <div className="text-center py-20 px-4 glass-panel rounded-3xl border border-border/50">
        <div className="inline-flex h-20 w-20 rounded-3xl bg-muted/50 items-center justify-center mb-6 text-muted-foreground border border-border/50">
          <FileText size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-foreground">No Active Tenders</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">You haven't initialized any RFPs yet. Create your first Request for Proposal to begin sourcing carriers.</p>
        <Link href="/rfps/new" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 active:scale-95">
          Create First RFP
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredRFPs.length === 0 && rfps.length > 0 && (
        <div className="col-span-full text-center py-20 text-muted-foreground font-medium glass-panel rounded-3xl border border-border/50">
          No RFPs match your current filters.
        </div>
      )}
      {filteredRFPs.map((rfp) => {

        const statusLabel = RFP_STATUSES.find((s) => s.value === rfp.status)?.label || rfp.status;
        const statusColorClass = rfp.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' :
          rfp.status === 'closed' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
            'bg-accent/10 text-accent border-accent/20';

        const StatusIcon = rfp.status === 'active' ? ShieldCheck :
          rfp.status === 'closed' ? AlertCircle : Clock;

        return (
          <Link
            key={rfp.id}
            href={`/rfps/${rfp.id}`}
            className="group flex flex-col glass-panel rounded-3xl p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 transition-all duration-300 relative overflow-hidden h-full border border-border/50"
          >
            {/* Visual accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 transition-colors ${rfp.status === 'active' ? 'bg-primary' : rfp.status === 'closed' ? 'bg-red-500' : 'bg-accent'
              }`} />

            <div className="flex items-start justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-foreground text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {rfp.title}
              </h3>
              <span className={`px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 flex items-center gap-1 ${statusColorClass}`}>
                <StatusIcon size={12} />
                {statusLabel}
              </span>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-end">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-card border border-border/50 rounded-2xl p-4 group-hover:border-primary/20 transition-colors">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Truck size={12} className="text-primary" /> Mode
                  </p>
                  <p className="font-bold text-foreground capitalize truncate">{rfp.mode?.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-4 group-hover:border-primary/20 transition-colors">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Calendar size={12} className="text-accent" /> Due Date
                  </p>
                  <p className="font-bold text-foreground truncate">
                    {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/50 mt-2 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <Clock size={12} />
                  {new Date(rfp.created_at).toLocaleDateString()}
                </div>
                <div className="text-primary font-black text-xs uppercase tracking-widest group-hover:gap-2 transition-all flex items-center gap-1">
                  Details <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
