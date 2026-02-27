'use client';

import { useState } from 'react';
import { Carrier, CarrierFormData, CarrierStatus } from '@/constants/types';
import { CARRIER_STATUSES } from '@/constants/statuses';
import { EQUIPMENT_TYPES } from '@/constants/equipmentTypes';
import { createCarrier, updateCarrier, getExistingFMCSA } from '@/services/carrierService';
import { getCarrierByDot, getCarrierByMc } from '@/services/fmcsaService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Check, AlertCircle, Loader2, ArrowRight, ShieldCheck, Info, RotateCcw, MapPin, ShieldAlert, FileText } from 'lucide-react';
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
  const [computedStatus, setComputedStatus] = useState<{ status: CarrierStatus, message: string } | null>(null);

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
    const identifier = formData.dot_number || formData.mc_number;
    console.log(`[FMCSA] Starting background verification for ${identifier}...`);

    try {
      // 1. Check local DB first for existing FMCSA data
      console.log(`[FMCSA] Checking local database for ${identifier}...`);
      let data = await getExistingFMCSA(formData.dot_number, formData.mc_number);

      let verifyType: 'dot' | 'mc' | undefined;

      if (data) {
        console.log(`[FMCSA] Found cached data in DB for ${data.legalName}`);
      } else {
        // 2. Fallback to FMCSA API
        verifyType = formData.dot_number ? 'dot' : 'mc';
        console.log(`[FMCSA] Not in DB. Fetching from FMCSA API via ${verifyType.toUpperCase()}...`);

        data = verifyType === 'dot'
          ? await getCarrierByDot(formData.dot_number)
          : await getCarrierByMc(formData.mc_number);
      }

      if (!data) {
        console.error(`[FMCSA] No record found for ${identifier}.`);
        throw new Error(`FMCSA Verification Failed: No carrier found with this ${verifyType?.toUpperCase() || 'MC/DOT'} number.`);
      }

      console.log(`[FMCSA] Success! Found: ${data.legalName} (${data.allowedToOperate})`);

      let computed: CarrierStatus = 'approved';
      let message = 'Authorized to Operate';

      if (data.allowedToOperate === 'N') {
        console.warn(`[FMCSA] Carrier ${data.legalName} is not authorized to operate.`);
        computed = 'suspended';
        message = 'Not Authorized to Operate';
      } else {
        const commonStatus = data.commonAuthorityStatus || 'N';
        const contractStatus = data.contractAuthorityStatus || 'N';
        const brokerStatus = data.brokerAuthorityStatus || 'N';
        const operationCode = data.carrierOperation?.carrierOperationCode || 'N';
        const statusCode = data.statusCode || 'N';

        // Let carriers through if they have ANY active authority (Common, Contract, or Broker) 
        // OR if their Operation Code is A (Interstate) or C (Intrastate)
        // OR if their overall Status Code is A (Active)
        if (commonStatus !== 'A' && contractStatus !== 'A' && brokerStatus !== 'A' && operationCode !== 'A' && operationCode !== 'C' && statusCode !== 'A') {
          console.warn(`[FMCSA] Carrier ${data.legalName} has no active authority.`);
          computed = 'suspended';
          message = 'No Active Operating Authority';
        } else {
          // Safety checks
          const vehicleOos = data.vehicleOosRate || 0;
          const vehicleNatAvg = parseFloat(String(data.vehicleOosRateNationalAverage || '0')) || 0;
          const driverOos = data.driverOosRate || 0;
          const driverNatAvg = parseFloat(String(data.driverOosRateNationalAverage || '0')) || 0;

          if ((vehicleNatAvg > 0 && vehicleOos > vehicleNatAvg) || (driverNatAvg > 0 && driverOos > driverNatAvg)) {
            computed = 'pending';
            message = 'Safety Review Required (High OOS Rate)';
            console.warn(`[FMCSA] Carrier flagged for safety review. Vehicle: ${vehicleOos}/${vehicleNatAvg}, Driver: ${driverOos}/${driverNatAvg}`);
          }
        }
      }

      setComputedStatus({ status: computed, message });
      setFmcsaData(data);
      setIsConfirming(true);
    } catch (err) {
      console.error('[FMCSA] Verification logic error:', err);
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
      // Structure the data according to the new schema
      // We NO LONGER overwrite the name with the FMCSA legal name here
      const finalData: CarrierFormData = {
        ...formData,
        // Ensure name is what the user entered, unless they left it blank (though it's required)
        name: formData.name || fmcsaData.legalName || '',
        phone: formData.phone || fmcsaData.phoneNumber || '',
        status: computedStatus ? computedStatus.status : (fmcsaData.allowedToOperate === 'Y' ? 'approved' : formData.status),
        mc_number: fmcsaData.mcNumber || formData.mc_number,
        dot_number: fmcsaData.dotNumber || formData.dot_number,
        // Move extended FMCSA data to its own nested object
        fmcsa_data: {
          legal_name: fmcsaData.legalName ?? null,
          phone: fmcsaData.phoneNumber ?? null,
          street: fmcsaData.phyStreet ?? null,
          city: fmcsaData.phyCity ?? null,
          state: fmcsaData.phyState ?? null,
          zip: fmcsaData.phyZipcode ?? null,
          common_authority: fmcsaData.commonAuthorityStatus ?? null,
          contract_authority: fmcsaData.contractAuthorityStatus ?? null,
          broker_authority: fmcsaData.brokerAuthorityStatus ?? null,
          vehicle_oos_rate: fmcsaData.vehicleOosRate ?? null,
          driver_oos_rate: fmcsaData.driverOosRate ?? null,
          allowed_to_operate: fmcsaData.allowedToOperate ?? null,
          raw_data: fmcsaData,
        }
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
          <div className="bg-muted/10 border border-border/50 rounded-[40px] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck size={200} />
            </div>

            <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Identity Verification</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Carrier Registry Source-of-Truth</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Official Registry Active</p>
              </div>
            </div>

            <div className="p-8 sm:p-12 flex flex-col items-center gap-8">
              {/* Top Section: User Input */}
              <div className="w-full max-w-lg space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px flex-1 bg-border/50" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-4">Your Entry</p>
                  <span className="h-px flex-1 bg-border/50" />
                </div>
                <div className="p-8 bg-background/50 border-2 border-dashed border-border rounded-[32px] text-center transition-all group hover:bg-background/80">
                  <p className="text-2xl font-bold text-foreground/40 leading-tight tracking-tight italic select-none">
                    "{formData.name || 'Anonymous Carrier'}"
                  </p>
                </div>
              </div>

              {/* Vertical Transition Arrow */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse group-hover:bg-primary/40 transition-all" />
                <div className="w-16 h-16 rounded-full bg-card border-4 border-muted shadow-2xl flex items-center justify-center text-primary relative z-10 hover:scale-110 transition-transform cursor-default">
                  <ArrowRight className="rotate-90" size={32} strokeWidth={3} />
                </div>
              </div>

              {/* Bottom Section: FMCSA Payload */}
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px flex-1 bg-primary/20" />
                  <p className="text-[10px] uppercase font-bold text-primary tracking-widest px-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    FMCSA Verified Data
                  </p>
                  <span className="h-px flex-1 bg-primary/20" />
                </div>

                <div className="bg-card border border-border shadow-2xl rounded-[40px] overflow-hidden relative group transition-all hover:border-primary/30">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary/50" />

                  <div className="p-8 sm:p-10 space-y-8">
                    {/* Main Identity */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border/50 pb-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Legal Entity Name</p>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">{fmcsaData.legalName}</h2>
                        {fmcsaData.dbaName && (
                          <p className="text-sm font-bold text-muted-foreground mt-2 italic flex items-center gap-1.5">
                            <Info size={14} className="opacity-50" />
                            DBA: {fmcsaData.dbaName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${computedStatus?.status === 'approved' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                          <ShieldCheck size={16} />
                          {computedStatus?.message}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-md">
                          {fmcsaData.carrierOperation?.carrierOperationDesc || 'Standard Carrier'}
                        </div>
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">USDOT Number</p>
                        <p className="font-mono text-lg font-black text-foreground">{fmcsaData.dotNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">MC Number</p>
                        <p className="font-mono text-lg font-black text-foreground">{fmcsaData.mcNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">Power Units</p>
                        <p className="text-lg font-black text-foreground">{fmcsaData.totalPowerUnits || '0'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">Total Drivers</p>
                        <p className="text-lg font-black text-foreground">{fmcsaData.totalDrivers || '0'}</p>
                      </div>
                    </div>

                    {/* Detailed Triage */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-5 bg-muted/20 border border-border/50 rounded-[24px] flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <MapPin size={16} className="text-primary" />
                          Physical Presence
                        </div>
                        <div className="text-sm font-semibold text-foreground/80 leading-relaxed">
                          <p className="text-foreground font-black">{fmcsaData.phyStreet}</p>
                          <p>{fmcsaData.phyCity}, {fmcsaData.phyState} {fmcsaData.phyZipcode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsConfirming(false)}
            className="flex-1 font-bold uppercase tracking-widest text-[10px] py-6 rounded-2xl border-transparent hover:bg-muted"
          >
            <RotateCcw size={16} className="mr-2" />
            Restart Verification
          </Button>
          <Button
            type="button"
            isLoading={loading}
            onClick={handleFinalSubmit}
            className="flex-[2] font-bold uppercase tracking-widest text-[10px] py-6 rounded-2xl shadow-2xl shadow-primary/30 transform hover:-translate-y-1 active:translate-y-0 transition-all"
          >
            Authenticate & Complete Registration
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
