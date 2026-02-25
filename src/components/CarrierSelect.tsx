'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Carrier, RFPInvite } from '@/constants/types';
import { getCarriers } from '@/services/carrierService';
import { createInvites } from '@/services/inviteService';

interface CarrierSelectProps {
  rfpId: string;
  existingInvites: RFPInvite[];
  onInvited: () => void;
}

export default function CarrierSelect({ rfpId, existingInvites, onInvited }: CarrierSelectProps) {
  const { orgId } = useAuth();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orgId) loadCarriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function loadCarriers() {
    if (!orgId) return;
    try {
      const data = await getCarriers(orgId);
      // Filter out carriers that are already invited and ensure they are approved/active
      const available = data.filter(
        (c) => c.status === 'approved' && !existingInvites.some((inv) => inv.carrier_id === c.id)
      );
      setCarriers(available);
    } catch (err) {
      console.error('Error loading carriers for select:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleCarrier(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleInvite() {
    if (selectedIds.size === 0) return;
    setError('');
    setSubmitting(true);

    try {
      await createInvites(rfpId, Array.from(selectedIds));
      setSelectedIds(new Set());
      onInvited();
      // Reload to remove newly invited carriers from the available list
      loadCarriers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invites');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-primary font-medium flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading available carriers...</div>;
  }

  if (carriers.length === 0) {
    return (
      <div className="p-4 bg-muted/50 border border-border rounded-xl text-center">
        <p className="text-sm font-medium text-muted-foreground">No eligible carriers available to invite.</p>
        <p className="text-xs text-muted-foreground mt-1">Carriers must be 'approved' in your network.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {carriers.map((carrier) => {
            const isSelected = selectedIds.has(carrier.id);
            return (
              <label
                key={carrier.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                  isSelected 
                    ? 'bg-primary/5 border-primary shadow-sm' 
                    : 'border-transparent hover:bg-muted/80 hover:border-border/50'
                }`}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCarrier(carrier.id)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 bg-background peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                  <svg className="absolute w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground truncate">{carrier.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {carrier.equipment_types?.join(', ') || 'No equipment listed'}
                  </div>
                </div>
                {carrier.mc_number && (
                   <div className="text-xs font-mono text-muted-foreground px-2 py-1 bg-muted rounded">
                     MC {carrier.mc_number}
                   </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-sm font-semibold text-foreground">
          {selectedIds.size} carrier{selectedIds.size !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={handleInvite}
          disabled={selectedIds.size === 0 || submitting}
          className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 text-sm"
        >
          {submitting ? 'Sending...' : 'Send Invites'}
        </button>
      </div>
    </div>
  );
}
