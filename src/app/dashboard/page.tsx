'use client';

import { useAuth } from '@/hooks/useAuth';
import { 
  Activity, 
  Truck, 
  FileText, 
  CheckCircle,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { appUser } = useAuth();

  const stats = [
    { label: 'Total RFPs', value: '12', icon: FileText, color: 'text-primary' },
    { label: 'Active Carriers', value: '48', icon: Truck, color: 'text-accent' },
    { label: 'Pending Bids', value: '24', icon: Activity, color: 'text-amber-500' },
    { label: 'Awarded Lanes', value: '156', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <header className="relative py-4">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Welcome back, <span className="text-primary">{appUser?.email?.split('@')[0] || 'Member'}</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Here's what's happening in your network today.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 shadow-sm ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <div className="flex items-end gap-2">
                   <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                   <div className="flex items-center text-[10px] font-bold text-green-500 mb-1 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                      <TrendingUp size={10} className="mr-0.5" /> +12%
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Recent Activity</h2>
          <button className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all text-left">
            View All <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="glass-panel overflow-hidden rounded-3xl border border-border/50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 flex items-center justify-between border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary border border-border/50 group-hover:bg-card transition-colors">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-foreground font-bold">New Bid Received</p>
                  <p className="text-sm text-muted-foreground font-medium">Carrier "Rapid Freight" bid on RFP #4029</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
