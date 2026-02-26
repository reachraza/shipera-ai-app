'use client';

import React, { useEffect, useState } from 'react';
import { Carrier } from '@/constants/types';
import { CARRIER_STATUSES } from '@/constants/statuses';
import { getCarriers, softDeleteCarrier } from '@/services/carrierService';
import { useAuth } from '@/hooks/useAuth';
import {
  Truck,
  Edit2,
  Trash2,
  Loader2,
  Mail,
  Hash,
  ShieldCheck,
  AlertCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

const ITEMS_PER_PAGE = 10;

interface CarrierTableProps {
  onEdit: (carrier: Carrier) => void;
  onRefresh: () => void;
  searchQuery?: string;
  statusFilter?: string;
  refreshKey?: number;
}

export default function CarrierTable({ onEdit, onRefresh, searchQuery = '', statusFilter = 'all', refreshKey = 0 }: CarrierTableProps) {

  const { orgId, role, loading: authLoading } = useAuth();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      if (orgId) {
        loadCarriers();
      } else {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, authLoading, refreshKey]);

  async function loadCarriers() {
    if (!orgId) return;
    try {
      const data = await getCarriers(orgId);
      setCarriers(data);
    } catch (err) {
      console.error('Error loading carriers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(carrier: Carrier) {
    if (!confirm(`Are you sure you want to remove "${carrier.name}"?`)) return;
    try {
      await softDeleteCarrier(carrier.id);
      onRefresh();
      loadCarriers();
    } catch (err) {
      console.error('Error deleting carrier:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground font-medium">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="animate-pulse">Loading carrier network...</p>
        </div>
      </div>
    );
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const filteredCarriers = carriers.filter((carrier) => {
    const matchesSearch =
      carrier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carrier.mc_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carrier.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || carrier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCarriers.length / ITEMS_PER_PAGE);
  const paginatedCarriers = filteredCarriers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (carriers.length === 0) {

    return (
      <div className="text-center py-20 px-4">
        <div className="inline-flex h-20 w-20 rounded-3xl bg-muted/50 items-center justify-center mb-6 text-muted-foreground border border-border/50">
          <Truck size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-foreground">No Carriers Registered</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">Your carrier network is waiting. Add your first partner to start soliciting bids on RFPs.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Carrier Details</th>
            <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Identifiers</th>
            <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Equipment Profile</th>
            <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Network Status</th>
            {role === 'admin' && (
              <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px] text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {filteredCarriers.length === 0 && carriers.length > 0 && (
            <tr>
              <td colSpan={5} className="text-center py-20 text-muted-foreground font-medium">
                No carriers match your current filters.
              </td>
            </tr>
          )}
          {paginatedCarriers.map((carrier) => {

            const statusInfo = CARRIER_STATUSES.find((s) => s.value === carrier.status);

            const StatusIcon = carrier.status === 'approved' ? ShieldCheck :
              carrier.status === 'suspended' ? AlertCircle : Clock;

            const statusColor = carrier.status === 'approved' ? 'bg-primary/10 text-primary border-primary/20' :
              carrier.status === 'suspended' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                'bg-accent/10 text-accent border-accent/20';

            return (
              <tr key={carrier.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-6 py-5">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    {carrier.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <Mail size={12} className="opacity-50" />
                    {carrier.email || 'No email provided'}
                  </div>
                </td>
                <td className="px-6 py-5 font-medium">
                  <div className="flex flex-col space-y-2">
                    {carrier.mc_number && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-border text-foreground text-[10px] font-bold group-hover:border-primary/20 transition-colors">
                        <Hash size={10} className="text-primary" />
                        MC {carrier.mc_number}
                      </span>
                    )}
                    {carrier.dot_number && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-border text-foreground text-[10px] font-bold group-hover:border-primary/20 transition-colors">
                        <Hash size={10} className="text-accent" />
                        DOT {carrier.dot_number}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2 items-center">
                    {carrier.equipment_types?.slice(0, 2).map((type) => (
                      <span key={type} className="px-2.5 py-1 bg-background border border-border text-foreground rounded-lg text-[10px] font-bold shadow-sm uppercase">
                        {type}
                      </span>
                    ))}
                    {carrier.equipment_types?.length > 2 && (
                      <span className="px-2 py-1 bg-muted/50 border border-border text-muted-foreground rounded-lg text-[10px] font-bold">
                        +{carrier.equipment_types.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                    <StatusIcon size={12} />
                    {statusInfo?.label || carrier.status}
                  </span>
                </td>
                {role === 'admin' && (
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(carrier)}
                        className="h-10 w-10 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(carrier)}
                        className="h-10 w-10 bg-card hover:bg-red-500 hover:text-white border-border rounded-xl"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredCarriers.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
