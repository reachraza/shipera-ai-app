'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import CarrierTable from '@/components/CarrierTable';
import CarrierViewModal from '@/components/CarrierViewModal';
import { Carrier } from '@/constants/types';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { softDeleteCarrier } from '@/services/carrierService';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

export default function CarriersPage() {
  const router = useRouter();
  const [viewingCarrier, setViewingCarrier] = useState<Carrier | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [carrierToDelete, setCarrierToDelete] = useState<Carrier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const { role } = useAuthContext();

  function handleAdd() {
    router.push('/carriers/new');
  }

  function handleEdit(carrier: Carrier) {
    router.push(`/carriers/${carrier.id}/edit`);
  }

  function handleView(carrier: Carrier) {
    setViewingCarrier(carrier);
  }

  async function handleDeleteConfirm() {
    if (!carrierToDelete) return;
    setIsDeleting(true);
    try {
      await softDeleteCarrier(carrierToDelete.id);
      setRefreshKey((prev: number) => prev + 1);
      setCarrierToDelete(null);
      if (viewingCarrier?.id === carrierToDelete.id) {
        setViewingCarrier(null);
      }
    } catch (err) {
      console.error('Error deleting carrier:', err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Truck size={24} />
            </div>
            Carrier Network
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your approved partners and fleet compliance</p>
        </div>
        {role === 'admin' && (
          <Button
            onClick={handleAdd}
            className="shrink-0 gap-2"
          >
            <Plus size={20} />
            Add Carrier
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name, MC#, or email..."
            icon={<Search size={18} />}
            className="bg-card/50 backdrop-blur-sm group-focus-within:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-full pl-10 pr-4 py-2 bg-muted/50 text-muted-foreground border border-border rounded-xl text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <CarrierTable
          onEdit={handleEdit}
          onView={handleView}
          onRefresh={() => setRefreshKey((prev: number) => prev + 1)}
          onDelete={setCarrierToDelete}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          refreshKey={refreshKey}
        />
      </div>

      {viewingCarrier && (
        <CarrierViewModal
          carrier={viewingCarrier}
          onClose={() => setViewingCarrier(null)}
          onDelete={setCarrierToDelete}
          onEdit={handleEdit}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!carrierToDelete}
        onClose={() => setCarrierToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Remove Carrier"
        message={`Are you sure you want to remove "${carrierToDelete?.name}" from your network? This action can be reversed by an administrator, and FMCSA registry data will remain preserved.`}
      />
    </div>
  );
}
