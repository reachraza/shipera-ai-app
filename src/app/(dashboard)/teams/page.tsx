'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TeamTable from '@/components/TeamTable';
import AddMemberModal from '@/components/AddMemberModal';
import { Users, UserPlus, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
    const { role, loading } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const router = useRouter();

    // If loading or not admin, show appropriate state
    if (loading) return null; // Let the layout/auth handle initial load state

    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Access Denied</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    You do not have permission to view this page. Only Organization Administrators can manage team members and roles.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3 border border-primary/20">
                        <Users size={16} />
                        Organization Settings
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                        Team Members
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium max-w-xl">
                        Manage who has access to your organization, invite new members, and configure their permission levels.
                    </p>
                </div>

                <div className="relative z-10 hidden sm:block delay-150 animate-in fade-in zoom-in duration-500">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3.5 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
                    >
                        <UserPlus size={20} />
                        Invite Member
                    </button>
                </div>
            </div>

            <div className="sm:hidden">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                    <UserPlus size={20} />
                    Invite Member
                </button>
            </div>

            {/* Main Content Area */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/10">
                    <h2 className="text-lg font-bold text-foreground">Active Users</h2>
                    <p className="text-sm text-muted-foreground">List of all users linked to this organization.</p>
                </div>

                <TeamTable refreshTrigger={refreshKey} />
            </div>

            {showAddModal && (
                <AddMemberModal
                    onClose={() => setShowAddModal(false)}
                    onAdded={() => {
                        // we keep the modal open to show the temporary password success screen
                        // we also refresh the table behind it
                        setRefreshKey(prev => prev + 1);
                    }}
                />
            )}
        </div>
    );
}
