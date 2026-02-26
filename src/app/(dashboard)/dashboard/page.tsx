'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, DashboardStats } from '@/services/dashboardService';
import { getRecentActivity } from '@/services/activityService';
import { ActivityLog } from '@/constants/types';
import {
  Activity,
  Truck,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Plus,
  RefreshCw,
  Mail,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { appUser } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('30');

  useEffect(() => {
    async function loadStats() {
      if (!appUser?.org_id) return;

      setLoading(true);
      setError(null);

      try {
        const daysToFetch = timeFilter === 'all' ? undefined : parseInt(timeFilter, 10);
        const [stats, recentActivities] = await Promise.all([
          getDashboardStats(appUser.org_id, daysToFetch),
          getRecentActivity(appUser.org_id, 10, daysToFetch) // Fetching a bit more for the filter feel
        ]);
        setData(stats);
        setActivities(recentActivities);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to load dashboard stats:', error);
        setError(error.message || 'Failed to connect to the database. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [appUser?.org_id, timeFilter]);

  const stats = [
    { label: 'Total RFPs', value: data?.totalRfps ?? '-', icon: FileText, color: 'text-primary' },
    { label: 'Active Carriers', value: data?.activeCarriers ?? '-', icon: Truck, color: 'text-accent' },
    { label: 'Total Lanes', value: data?.totalLanes ?? '-', icon: Activity, color: 'text-indigo-500' },
    { label: 'Invites Sent', value: data?.totalInvites ?? '-', icon: CheckCircle, color: 'text-green-500' },
  ];

  function getActivityDisplay(action: string, entity: string, metadata: Record<string, unknown> = {}) {
    let title = 'Action Logged';
    let subtitle = `A ${entity} was ${action}d.`;
    let Icon = Activity;
    let color = 'text-primary';

    if (action === 'create') {
      Icon = Plus;
      color = 'text-green-500';
      if (entity === 'rfp') {
        title = 'RFP Created';
        subtitle = `A new Tender Event was drafted.`;
      } else if (entity === 'carrier') {
        title = 'Carrier Added';
        subtitle = `A new carrier profile was built.`;
      } else if (entity === 'rfp_lane') {
        title = 'Lanes Added';
        subtitle = `New lanes were added to a tender.`;
      } else if (entity === 'bid') {
        title = 'Bid Submitted';
        subtitle = `A bid was received from ${(metadata?.carrier_name as string) || 'a carrier'}.`;
        color = 'text-indigo-500';
        Icon = Activity;
      }
    } else if (action === 'invite') {
      Icon = Mail;
      color = 'text-accent';
      title = 'Carrier Invited';
      subtitle = 'An invitation was sent to a carrier for an RFP.';
    } else if (action === 'upload') {
      Icon = FileText;
      color = 'text-primary';
      title = 'Lanes Uploaded';
      subtitle = 'A CSV of freight lanes was successfully processed.';
    } else if (action === 'update') {
      Icon = RefreshCw;
      color = 'text-indigo-500';
      title = 'Record Updated';
      subtitle = `A ${entity.replace('_', ' ')} profile was modified.`;

      if (entity === 'rfp' && metadata?.new_status) {
        if (metadata.new_status === 'active') {
          title = 'RFP Activated';
          subtitle = 'The RFP is now open for bidding.';
          color = 'text-green-500';
          Icon = Activity;
        } else if (metadata.new_status === 'closed') {
          title = 'RFP Closed';
          subtitle = 'The RFP is no longer accepting bids.';
          color = 'text-red-500';
          Icon = Activity;
        } else if (metadata.new_status === 'draft') {
          title = 'RFP Reopened';
          subtitle = 'The RFP was moved back to draft status.';
          color = 'text-primary'; // Yellow
          Icon = Activity;
        }
      }
    }

    return { title, subtitle, Icon, color };
  }

  // Returns e.g. "2 hours ago"
  function getRelativeTime(dateString: string) {
    const diffMs = new Date().getTime() - new Date(dateString).getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <header className="relative py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Welcome back, <span className="text-primary">{appUser?.full_name || appUser?.email?.split('@')[0] || 'Member'}</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Here&apos;s what&apos;s happening in your network today.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative z-10 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-sm">
          <Filter size={16} className="text-muted-foreground" />
          <select
            className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer appearance-none pr-4"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last Quarter</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4">
          <AlertTriangle className="shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-bold text-lg mb-1">We ran into a snag!</h3>
            <p className="text-sm font-medium opacity-90">{error}</p>
            <Button
              variant="destructive"
              onClick={() => window.location.reload()}
              className="mt-4 text-xs uppercase tracking-widest px-4 py-2"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      ) : (
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Activity Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Recent Activity</h2>
          <Link href="/activity" className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all text-left">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-panel overflow-hidden rounded-3xl border border-border/50">
          {activities.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p className="font-bold">No recent activity</p>
              <p className="text-sm font-medium opacity-80 mt-1">Actions you take like creating RFPs or inviting carriers will appear here.</p>
            </div>
          ) : (
            activities.slice(0, 5).map((activity) => {
              const { title, subtitle, Icon, color } = getActivityDisplay(activity.action_type, activity.entity_type, activity.metadata);
              return (
                <div key={activity.id} className="p-6 flex items-center justify-between border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border/50 group-hover:bg-card transition-colors ${color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{title}</p>
                      <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{getRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
