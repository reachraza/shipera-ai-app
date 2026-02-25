'use client';

import RFPList from '@/components/RFPList';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RFPsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText size={24} />
            </div>
            RFPs & Tenders
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage freight requests for proposals and carrier bidding</p>
        </div>
        <Button
          href="/rfps/new"
          className="shrink-0 gap-2"
        >
          <Plus size={20} />
          Create RFP
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by title, mode, or status..."
            icon={<Search size={18} />}
            className="bg-card/50 backdrop-blur-sm group-focus-within:ring-primary/20"
          />
        </div>
        <Button variant="outline" className="gap-2 bg-muted/50 text-muted-foreground border-border">
          <Filter size={18} />
          Filter
        </Button>
      </div>

      <div className="pt-2">
        <RFPList />
      </div>
    </div>
  );
}
