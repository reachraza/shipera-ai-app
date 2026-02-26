'use client';

import { useState } from 'react';
import { Carrier, CarrierFormData } from '@/constants/types';
import { CARRIER_STATUSES } from '@/constants/statuses';
import { EQUIPMENT_TYPES } from '@/constants/equipmentTypes';
import { createCarrier, updateCarrier } from '@/services/carrierService';
import { getCarrierByDot, getCarrierByMc } from '@/services/fmcsaService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Check, AlertCircle, Loader2, ArrowRight, ShieldCheck, Info, RotateCcw } from 'lucide-react';
import { FMCSACarrier } from '@/services/fmcsaService';

interface CarrierFormProps {
  carrier?: Carrier | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function CarrierForm({ carrier, onSaved, onCancel }: CarrierFormProps) {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [fmcsaData, setFmcsaData] = useState<FMCSACarrier | null>(null);

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

    // Require at least one identifier
    if (!formData.mc_number?.trim() && !formData.dot_number?.trim()) {
      setError('Either an MC Number or DOT Number is compulsory as an identifier.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Automatic Verification
      const identifier = formData.dot_number || formData.mc_number;
      const verifyType = formData.dot_number ? 'dot' : 'mc';

      const data = verifyType === 'dot'
        ? await getCarrierByDot(formData.dot_number)
        : await getCarrierByMc(formData.mc_number);

      if (!data) {
        throw new Error(`FMCSA Verification Failed: No carrier found with this ${verifyType.toUpperCase()} number.`);
      }

      if (data.allowedToOperate === 'N') {
        throw new Error('This carrier is NOT authorized to operate according to FMCSA records.');
      }

      setFmcsaData(data);
      setIsConfirming(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit() {
    if (!orgId || !fmcsaData) return;
    setLoading(true);
    setError('');

    try {
      const finalData: CarrierFormData = {
        ...formData,
        name: formData.name || fmcsaData.legalName || '',
        phone: formData.phone || fmcsaData.phoneNumber || '',
        status: fmcsaData.allowedToOperate === 'Y' ? 'approved' : formData.status,
        mc_number: fmcsaData.mcNumber || formData.mc_number,
        dot_number: fmcsaData.dotNumber || formData.dot_number,
      };

      if (carrier) {
        await updateCarrier(carrier.id, finalData);
      } else {
        await createCarrier(orgId, finalData);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  if (isConfirming && fmcsaData) {
    return (
      <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-xl font-black text-foreground">Review Carrier Details</h3>
          <p className="text-sm text-muted-foreground">Please confirm the official FMCSA details match your request.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50 flex items-center gap-2">
              <Info size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Legal Name Verification</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">You Entered</p>
                <p className="text-lg font-bold text-foreground/70">{formData.name || 'Anonymous'}</p>
              </div>
              <div className="hidden md:block">
                <ArrowRight className="text-muted-foreground/30" size={24} />
              </div>
              <div className="space-y-1 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Official Record</p>
                <p className="text-lg font-black text-foreground">{fmcsaData.legalName}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">DOT Number</p>
              <p className="font-mono font-bold text-primary">DOT-{fmcsaData.dotNumber}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-green-600 dark:text-green-400">Authorized to Operate</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsConfirming(false)}
            className="flex-1 font-bold uppercase tracking-widest text-[10px] py-6"
          >
            <RotateCcw size={16} className="mr-2" />
            Go Back & Edit
          </Button>
          <Button
            type="button"
            isLoading={loading}
            onClick={handleFinalSubmit}
            className="flex-[2] font-bold uppercase tracking-widest text-[10px] py-6 shadow-xl shadow-primary/20"
          >
            Confirm & Complete Registration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Carrier Name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="ABC Trucking"
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="dispatch@abctrucking.com"
        />

        <Input
          label="MC Number"
          name="mc_number"
          type="text"
          required={!formData.dot_number?.trim()}
          value={formData.mc_number}
          onChange={handleChange}
          placeholder="MC-123456"
          title="Either MC Number or DOT Number is required"
        />

        <Input
          label="DOT Number"
          name="dot_number"
          type="text"
          required={!formData.mc_number?.trim()}
          value={formData.dot_number}
          onChange={handleChange}
          placeholder="DOT-789012"
          title="Either MC Number or DOT Number is required"
        />

        <Input
          label="Phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
        />

        <Input
          label="Insurance Expiration"
          name="insurance_expiration"
          type="date"
          value={formData.insurance_expiration || ''}
          onChange={handleChange}
          className="[color-scheme:light] dark:[color-scheme:dark]"
        />

        <div className="md:col-span-2">
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={CARRIER_STATUSES}
          />
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
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.equipment_types.includes(type)
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
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1 sm:flex-none font-bold border-transparent hover:bg-muted"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          className="flex-1 sm:flex-none"
        >
          {carrier ? 'Update Carrier' : 'Complete Registration'}
        </Button>
      </div>
    </form>
  );
}
