'use client';

import { useState } from 'react';
import { Carrier, CarrierFormData } from '@/constants/types';
import { CARRIER_STATUSES } from '@/constants/statuses';
import { EQUIPMENT_TYPES } from '@/constants/equipmentTypes';
import { createCarrier, updateCarrier } from '@/services/carrierService';
import { useAuth } from '@/hooks/useAuth';

interface CarrierFormProps {
  carrier?: Carrier | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function CarrierForm({ carrier, onSaved, onCancel }: CarrierFormProps) {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CarrierFormData>({
    name: carrier?.name || '',
    mc_number: carrier?.mc_number || '',
    dot_number: carrier?.dot_number || '',
    equipment_types: carrier?.equipment_types || [],
    email: carrier?.email || '',
    phone: carrier?.phone || '',
    insurance_expiration: carrier?.insurance_expiration || '',
    status: carrier?.status || 'pending',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleEquipmentToggle(type: string) {
    setFormData((prev) => ({
      ...prev,
      equipment_types: prev.equipment_types.includes(type)
        ? prev.equipment_types.filter((t) => t !== type)
        : [...prev.equipment_types, type],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setError('');
    setLoading(true);

    try {
      if (carrier) {
        await updateCarrier(carrier.id, formData);
      } else {
        await createCarrier(orgId, formData);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Carrier Name <span className="text-red-500">*</span></label>
          <input
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground"
            placeholder="ABC Trucking"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground"
            placeholder="dispatch@abctrucking.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">MC Number</label>
          <input
            name="mc_number"
            type="text"
            value={formData.mc_number}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground"
            placeholder="MC-123456"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">DOT Number</label>
          <input
            name="dot_number"
            type="text"
            value={formData.dot_number}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground"
            placeholder="DOT-789012"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Phone</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground"
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Insurance Expiration</label>
          <input
            name="insurance_expiration"
            type="date"
            value={formData.insurance_expiration}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-semibold text-foreground">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground appearance-none"
          >
            {CARRIER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-sm font-semibold text-foreground mb-3">Equipment Types</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleEquipmentToggle(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                formData.equipment_types.includes(type)
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105'
                  : 'bg-muted text-muted-foreground border-border hover:bg-background hover:text-foreground hover:border-primary/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-none px-6 py-3 text-muted-foreground font-bold rounded-xl border border-border hover:bg-muted hover:text-foreground transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all shadow-md shadow-primary/20 hover:shadow-primary/40"
        >
          {loading ? 'Saving...' : carrier ? 'Update Carrier' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
}
