'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getRecentActivity } from '@/services/activityService';
import { ActivityLog } from '@/constants/types';
import Pagination from '@/components/ui/Pagination';
import {
    Activity,
    Plus,
    Mail,
    FileText,
    RefreshCw,
    Loader2,
    AlertTriangle,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const ITEMS_PER_PAGE = 20; // Show a bit more on the dedicated list page

export default function ActivityPage() {
    const { orgId, loading: authLoading } = useAuth();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!authLoading) {
            if (orgId) {
                loadActivity();
            } else {
                setLoading(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, authLoading]);

    async function loadActivity() {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch a large chunk for the dedicated page (e.g. 500) so we can paginate locally
            const data = await getRecentActivity(orgId, 500);
            setActivities(data);
        } catch (err) {
            console.error('Failed to load activity:', err);
            setError('Could not load your activity feed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Reuse the exact same dashboard logic for generating icons/labels
    function getActivityDisplay(action: string, entity: string) {
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
            color = 'text-amber-500';
            title = 'Record Updated';
            subtitle = `A ${entity.replace('_', ' ')} profile was modified.`;
        }

        return { title, subtitle, Icon, color };
    }

    function getRelativeTime(dateString: string) {
        const diffMs = new Date().getTime() - new Date(dateString).getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    }

    const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
    const paginatedActivities = activities.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-2">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Activity Hub
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        A complete log of everything happening across your network.
                    </p>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-3xl flex items-start gap-4">
                    <AlertTriangle className="shrink-0 mt-0.5" size={24} />
                    <p className="text-sm font-medium opacity-90">{error}</p>
                </div>
            )}

            <div className="glass-panel rounded-3xl border border-border/50">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                        <p className="font-medium animate-pulse">Loading full history...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-20 text-center text-muted-foreground">
                        <Activity className="mx-auto h-16 w-16 opacity-20 mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No activity recorded</h3>
                        <p className="font-medium opacity-80 max-w-sm mx-auto">Actions you take like creating RFPs, uploading lanes, or inviting carriers will appear here.</p>
                    </div>
                ) : (
                    <div>
                        <div className="divide-y divide-border/40">
                            {paginatedActivities.map((activity) => {
                                const { title, subtitle, Icon, color } = getActivityDisplay(activity.action_type, activity.entity_type);
                                return (
                                    <div key={activity.id} className="p-6 sm:px-8 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border border-border/50 group-hover:bg-card group-hover:shadow-md transition-all ${color}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <p className="text-foreground font-bold text-lg">{title}</p>
                                                <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <p className="text-xs font-black text-foreground">{new Date(activity.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{getRelativeTime(activity.created_at)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-6 sm:px-8 border-t border-border/50 bg-muted/10 rounded-b-3xl">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={activities.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
