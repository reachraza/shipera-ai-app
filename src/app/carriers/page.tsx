'use client';

import React, { useState } from 'react';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import CarrierTable from '@/components/CarrierTable';
import CarrierForm from '@/components/CarrierForm';
import { Carrier } from '@/constants/types';
import { useAuthContext } from '@/context/AuthProvider';

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
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 shrink-0"
          >
            <Plus size={20} />
            Add Carrier
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by name, MC#, or email..."
            className="w-full pl-12 pr-4 py-3.5 bg-card/50 backdrop-blur-sm border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-muted/50 border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <Filter size={18} />
          Filter
        </button>
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
