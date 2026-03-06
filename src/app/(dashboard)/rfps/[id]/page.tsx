'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRFP, updateRFPStatus, deleteRFP } from '@/services/rfpService';
import { getLanesByRFP, deleteLanes } from '@/services/laneService';
import { getInvitesByRFP } from '@/services/inviteService';
import { RFP, RFPLane, RFPInvite } from '@/constants/types';
import LaneTable from '@/components/LaneTable';
import CSVUpload from '@/components/CSVUpload';
import CarrierSelect from '@/components/CarrierSelect';
import InviteTable from '@/components/InviteTable';
import BidList from '@/components/BidList';
import InboundEmailList from '@/components/InboundEmailList';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { RFP_STATUSES } from '@/constants/statuses';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Truck,
  UserPlus,
  Layers,
  Clock,
  Loader2,
  DollarSign,
  Trash2,
  Mail
} from 'lucide-react';

export default function RFPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;
  const [rfp, setRFP] = useState<RFP | null>(null);
  const [lanes, setLanes] = useState<RFPLane[]>([]);
  const [invites, setInvites] = useState<RFPInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // State for lane delete modal
  const [lanesToDelete, setLanesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for RFP delete
  const [showDeleteRFP, setShowDeleteRFP] = useState(false);
  const [isDeletingRFP, setIsDeletingRFP] = useState(false);

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

  async function handleStatusChange(newStatus: RFP['status']) {
    try {
      await updateRFPStatus(rfpId, newStatus);
      const updatedData = await getRFP(rfpId);
      setRFP(updatedData);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update RFP status.');
    }
  }

  async function handleDeleteRFP() {
    setIsDeletingRFP(true);
    try {
      await deleteRFP(rfpId);
      router.push('/rfps');
    } catch (err) {
      console.error('Error deleting RFP:', err);
      alert('Failed to delete RFP.');
      setIsDeletingRFP(false);
    }
  }

  async function confirmDeleteLane() {
    if (lanesToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      await deleteLanes(lanesToDelete);
      // Optimistically update UI
      setLanes((prev) => prev.filter((l) => !lanesToDelete.includes(l.id)));
      setLanesToDelete([]); // Close modal
    } catch (err) {
      console.error('Error deleting lane(s):', err);
      alert('Failed to delete lane(s).');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDeleteClick(laneId: string) {
    setLanesToDelete([laneId]);
  }

  function handleBulkDeleteClick(laneIds: string[]) {
    setLanesToDelete(laneIds);
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
        <p className="text-muted-foreground mt-2 font-medium">The requested tender does not exist or you don&apos;t have permission.</p>
        <button
          onClick={() => router.push('/rfps')}
          className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all active:scale-95 cursor-pointer"
        >
          Return to RFPs
        </button>
      </div>
    );
  }

  const isOverdue = rfp.deadline && new Date(rfp.deadline).getTime() < new Date().getTime();
  const displayStatus = isOverdue ? 'closed' : rfp.status;
  const statusInfo = RFP_STATUSES.find((s) => s.value === displayStatus);
  const isContentLocked = displayStatus === 'awarded' || displayStatus === 'closed' || displayStatus === 'active'; // lanes, bids
  const isCarrierLocked = displayStatus === 'awarded' || displayStatus === 'closed'; // invites only
  const isLocked = isContentLocked; // used for status buttons

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={() => router.push('/rfps')}
        className="group text-sm font-black text-muted-foreground hover:text-primary flex items-center gap-2 transition-all w-fit uppercase tracking-widest cursor-pointer"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to list
      </button>

      {/* RFP Header */}
      <div className={`glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden border-2 animate-in fade-in duration-500 ${displayStatus === 'active' ? '!border-primary/60 shadow-xl shadow-primary/5' :
        displayStatus === 'awarded' ? '!border-emerald-500/60 shadow-xl shadow-emerald-500/5' :
          displayStatus === 'closed' ? '!border-red-500/60 shadow-xl shadow-red-500/5' :
            '!border-border/50'
        }`}>
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
                Deadline: {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-xl border border-border/50">
                <Clock size={14} className="text-indigo-500" />
                Created: {new Date(rfp.created_at).toLocaleDateString()}
              </span>
            </div>
            {rfp.notes && (
              <div className="mt-8 relative group">
                <div className="absolute -left-4 top-0 w-1 h-full bg-border group-hover:bg-primary transition-colors" />
                <p className="text-foreground/80 text-sm font-medium leading-relaxed italic">
                  &quot;{rfp.notes}&quot;
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-3 self-start">
            <span
              className="px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] text-white shadow-xl whitespace-nowrap shadow-primary/10 uppercase"
              style={{ backgroundColor: statusInfo?.color || '#94a3b8' }}
            >
              {statusInfo?.label || displayStatus}
            </span>

            {!isLocked && rfp.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="text-xs font-bold text-primary hover:text-primary-hover border border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Publish RFP
              </button>
            )}
            {!isLocked && rfp.status === 'active' && (
              <button
                onClick={() => handleStatusChange('closed')}
                className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Close Bidding
              </button>
            )}
            {!isLocked && rfp.status === 'closed' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/50 bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg transition-all"
              >
                Reopen
              </button>
            )}
            {rfp.status === 'draft' && (
              <button
                onClick={() => setShowDeleteRFP(true)}
                className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 mt-1 cursor-pointer"
              >
                <Trash2 size={12} />
                Delete RFP
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Lanes Section */}
        <div className={`glass-panel rounded-3xl p-8 sm:p-10 xl:col-span-2 flex flex-col border-2 ${displayStatus === 'active' ? '!border-primary/30' :
          displayStatus === 'awarded' ? '!border-emerald-500/30' :
            displayStatus === 'closed' ? '!border-red-500/30' :
              'border-border/50'
          }`}>
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
            <CSVUpload rfpId={rfpId} onUploaded={loadData} isLocked={isContentLocked} hasInvites={invites.length > 0} />
          </div>
          <div className={`border-2 rounded-2xl overflow-hidden shadow-2xl ${displayStatus === 'active' ? '!border-primary/20 shadow-primary/5' :
            displayStatus === 'awarded' ? '!border-emerald-500/20 shadow-emerald-500/5' :
              displayStatus === 'closed' ? '!border-red-500/20 shadow-red-500/5' :
                'border-border/50 shadow-primary/5'
            }`}>
            <LaneTable lanes={lanes} onDelete={handleDeleteClick} onBulkDelete={handleBulkDeleteClick} isLocked={isContentLocked} hasInvites={invites.length > 0} />
          </div>
        </div>

        {/* Carrier Invites Section */}
        <div className={`glass-panel rounded-3xl p-8 sm:p-10 flex flex-col border-2 ${displayStatus === 'active' ? '!border-primary/30' :
          displayStatus === 'awarded' ? '!border-emerald-500/30' :
            displayStatus === 'closed' ? '!border-red-500/30' :
              'border-border/50'
          }`}>
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
            <CarrierSelect rfpId={rfpId} existingInvites={invites} onInvited={loadData} isLocked={isCarrierLocked} rfpStatus={rfp.status} />
          </div>
          <div className={`border-2 rounded-2xl overflow-hidden shadow-2xl ${displayStatus === 'active' ? '!border-primary/20 shadow-primary/5' :
            displayStatus === 'awarded' ? '!border-emerald-500/20 shadow-emerald-500/5' :
              displayStatus === 'closed' ? '!border-red-500/20 shadow-red-500/5' :
                'border-border/50 shadow-accent/5'
            }`}>
            <InviteTable invites={invites} isLocked={isCarrierLocked} onRevoke={loadData} />
          </div>
        </div>
      </div>

      {/* Embedded Bids Viewer */}
      <div className={`glass-panel rounded-3xl p-8 sm:p-10 border-2 ${rfp.status === 'active' ? '!border-primary/30' :
        rfp.status === 'awarded' ? '!border-emerald-500/30' :
          rfp.status === 'closed' ? '!border-red-500/30' :
            'border-border/50'
        }`}>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <DollarSign size={24} className="text-green-500" />
            Bids Received
          </h2>
        </div>
        <BidList rfpId={rfpId} isLocked={isCarrierLocked} />
      </div>

      {/* Embedded Inbound Emails Viewer */}
      <div className={`glass-panel rounded-3xl p-8 sm:p-10 border-2 ${rfp.status === 'active' ? 'border-primary/30!' :
        rfp.status === 'awarded' ? 'border-emerald-500/30!' :
          rfp.status === 'closed' ? 'border-red-500/30!' :
            'border-border/50'
        }`}>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Mail size={24} className="text-blue-500" />
            Carrier Replies
          </h2>
        </div>
        <InboundEmailList rfpId={rfpId} />
      </div>

      <DeleteConfirmationModal
        isOpen={lanesToDelete.length > 0}
        onClose={() => !isDeleting && setLanesToDelete([])}
        onConfirm={confirmDeleteLane}
        title={lanesToDelete.length > 1 ? `Delete ${lanesToDelete.length} Freight Lanes` : "Delete Freight Lane"}
        message={lanesToDelete.length > 1 ? `Are you sure you want to remove these ${lanesToDelete.length} lanes from the RFP? Carriers will no longer be able to bid on them.` : "Are you sure you want to remove this lane from the RFP? Carriers will no longer be able to bid on it."}
        isLoading={isDeleting}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteRFP}
        onClose={() => !isDeletingRFP && setShowDeleteRFP(false)}
        onConfirm={handleDeleteRFP}
        title="Delete RFP"
        message={`Are you sure you want to permanently delete "${rfp?.title}"? This action cannot be undone and will remove all associated lanes and invites.`}
        isLoading={isDeletingRFP}
      />
    </div>
  );
}
