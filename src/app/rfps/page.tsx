'use client';

import RFPList from '@/components/RFPList';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter 
} from 'lucide-react';

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
        <Link
          href="/rfps/new"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 shrink-0"
        >
          <Plus size={20} />
          Create RFP
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by title, mode, or status..."
            className="w-full pl-12 pr-4 py-3.5 bg-card/50 backdrop-blur-sm border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-muted/50 border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <Filter size={18} />
          Filter
        </button>
      </div>

      <div className="pt-2">
         <RFPList />
      </div>
    </div>
  );
}
