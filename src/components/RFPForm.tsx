'use client';

import { useState } from 'react';
import { RFPFormData, RFPMode } from '@/constants/types';
import { createRFP } from '@/services/rfpService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

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

      <Input
        label="RFP Title"
        name="title"
        type="text"
        required
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., Q2 2026 Midwest Replenishment Lanes"
        className="text-lg"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          label="Transport Mode"
          name="mode"
          required
          value={formData.mode}
          onChange={handleChange}
          options={MODES}
        />

        <Input
          label="Submission Deadline"
          name="deadline"
          type="date"
          value={formData.deadline || ''}
          onChange={handleChange}
          className="[color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      <Textarea
        label="Scope Notes & Additional Details"
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        rows={4}
        placeholder="Provide any additional context, specialized requirements, or access restrictions..."
      />

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
          className="flex-1 sm:flex-none gap-2"
        >
          {loading ? 'Building...' : 'Initialize RFP & Add Lanes'}
        </Button>
      </div>
    </form>
  );
}
