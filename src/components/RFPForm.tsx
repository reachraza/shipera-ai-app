'use client';

import { useState } from 'react';
import { RFPFormData, RFPMode } from '@/constants/types';
import { createRFP } from '@/services/rfpService';
import { useAuth } from '@/hooks/useAuth';

const MODES: { value: RFPMode; label: string }[] = [
  { value: 'full_truckload', label: 'Full Truckload (FTL)' },
  { value: 'ltl', label: 'Less Than Truckload (LTL)' },
  { value: 'intermodal', label: 'Intermodal' },
];

interface RFPFormProps {
  onSaved: (rfpId: string) => void;
  onCancel: () => void;
}

export default function RFPForm({ onSaved, onCancel }: RFPFormProps) {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<RFPFormData>({
    title: '',
    mode: 'full_truckload',
    deadline: '',
    notes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setError('');
    setLoading(true);

    try {
      const rfp = await createRFP(orgId, formData);
      onSaved(rfp.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-foreground">RFP Title <span className="text-red-500">*</span></label>
        <input
          name="title"
          type="text"
          required
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground text-lg font-medium placeholder-muted-foreground/50"
          placeholder="e.g., Q2 2026 Midwest Replenishment Lanes"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Transport Mode <span className="text-red-500">*</span></label>
          <div className="relative">
            <select
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground appearance-none pr-10"
            >
              {MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Submission Deadline</label>
          <input
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-muted text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-foreground">Scope Notes & Additional Details</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground resize-none leading-relaxed"
          placeholder="Provide any additional context, specialized requirements, or access restrictions..."
        />
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
          className="flex-1 sm:flex-none px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2"
        >
          {loading ? (
             <>
               <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               Building...
             </>
          ) : 'Initialize RFP & Add Lanes'}
        </button>
      </div>
    </form>
  );
}
