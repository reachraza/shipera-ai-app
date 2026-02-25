'use client';

import RFPForm from '@/components/RFPForm';
import { useRouter } from 'next/navigation';

export default function NewRFPPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Create New RFP</h1>
        <p className="text-muted-foreground mt-1 text-sm">Define your freight requirements and timeline</p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
        <RFPForm
          onSaved={(rfpId) => router.push(`/rfps/${rfpId}`)}
          onCancel={() => router.push('/rfps')}
        />
      </div>
    </div>
  );
}
