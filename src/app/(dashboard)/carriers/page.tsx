'use client';

import React, { useState } from 'react';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import CarrierTable from '@/components/CarrierTable';
import CarrierForm from '@/components/CarrierForm';
import { Carrier } from '@/constants/types';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CarriersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { role } = useAuthContext();

  function handleAdd() {
    setEditingCarrier(null);
    setShowForm(true);
  }

  function handleEdit(carrier: Carrier) {
    setEditingCarrier(carrier);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setEditingCarrier(null);
    setRefreshKey((prev: number) => prev + 1);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingCarrier(null);
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
          />
        </div>
        <Button variant="outline" className="gap-2 bg-muted/50 text-muted-foreground border-border">
          <Filter size={18} />
          Filter
        </Button>
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <h2 className="text-xl font-bold text-foreground mb-6">
              {editingCarrier ? 'Edit Carrier Profile' : 'Register New Carrier'}
            </h2>
            <CarrierForm
              carrier={editingCarrier}
              onSaved={handleSaved}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <CarrierTable
          onEdit={handleEdit}
          onRefresh={() => setRefreshKey((prev: number) => prev + 1)}
        />
      </div>
    </div>
  );
}
