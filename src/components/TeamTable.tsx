'use client';

import { useEffect, useState } from 'react';
import { User, UserRole } from '@/constants/types';
import { getOrganizationUsers, updateUserRole, removeUserFromOrg } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, User as UserIcon, Loader2, Trash2, CalendarDays, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TeamTableProps {
    refreshTrigger: number;
    searchQuery?: string;
}

export default function TeamTable({ refreshTrigger, searchQuery = '' }: TeamTableProps) {

    const { orgId, role: currentUserRole, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && orgId) {
            loadUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, authLoading, refreshTrigger]);

    async function loadUsers() {
        try {
            if (!orgId) return;
            setLoading(true);
            const data = await getOrganizationUsers(orgId);
            setUsers(data);
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(user: User, newRole: UserRole | 'supervisor') {
        // Only admins should perform this action
        if (currentUserRole !== 'admin') return;

        // Quick confirmation if changing someone to/from admin
        if (newRole === 'admin' || user.role === 'admin') {
            if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        }

        try {
            await updateUserRole(user.id, newRole as UserRole);
            loadUsers();
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update user role.');
        }
    }

    async function handleRemove(user: User) {
        if (currentUserRole !== 'admin') return;
        if (!confirm(`Remove ${user.email} from the organization? They will lose all access.`)) return;

        try {
            await removeUserFromOrg(user.id);
            loadUsers();
        } catch (err) {
            console.error('Error removing user:', err);
            alert('Failed to remove user.');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4 text-muted-foreground font-medium">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <p className="animate-pulse">Loading organization members...</p>
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-muted/30 border-b border-border">
                        <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Team Member</th>
                        <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Access Role</th>
                        <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px]">Joined Date</th>
                        {currentUserRole === 'admin' && (
                            <th className="px-6 py-5 font-bold text-muted-foreground tracking-wider uppercase text-[10px] text-right">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {filteredUsers.length === 0 && users.length > 0 && (
                        <tr>
                            <td colSpan={currentUserRole === 'admin' ? 4 : 3} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                No members match your search.
                            </td>
                        </tr>
                    )}
                    {users.length === 0 && (

                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                                <div className="inline-flex h-12 w-12 bg-muted text-muted-foreground rounded-full items-center justify-center mb-3">
                                    <UserIcon size={20} />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">No other members found</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    If this is unexpected, ensure you have run the database update SQL scripts in Supabase to enable team viewing permissions.
                                </p>
                            </td>
                        </tr>
                    )}
                    {filteredUsers.map((user) => {

                        const date = new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });

                        return (
                            <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="font-bold text-foreground flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs ${user.role === 'admin'
                                            ? 'bg-primary/20 text-primary border-primary/30'
                                            : 'bg-muted border-border text-muted-foreground'
                                            }`}>
                                            {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm">{user.full_name || 'Unnamed Member'}</span>
                                            <span className="text-xs text-muted-foreground font-medium mt-0.5">{user.email || 'No email associated'}</span>
                                            {user.id === (typeof window !== 'undefined' ? '' : '') && <span className="text-[10px] text-primary uppercase tracking-widest mt-0.5">You</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    {currentUserRole === 'admin' ? (
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                                            className="bg-transparent border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary text-xs font-bold uppercase tracking-wider text-foreground cursor-pointer shadow-sm hover:border-primary/50 transition-colors"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="coordinator">Coordinator</option>
                                        </select>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-muted/50 text-muted-foreground border-border">
                                            {user.role === 'admin' ? <ShieldCheck size={12} className="text-primary" /> : <UserIcon size={12} />}
                                            {user.role}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-5 font-medium text-muted-foreground text-xs flex items-center gap-2">
                                    <CalendarDays size={14} className="opacity-50" />
                                    {date}
                                </td>

                                {currentUserRole === 'admin' && (
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(user)}
                                                className="h-9 w-9 text-muted-foreground hover:bg-red-500 hover:text-white border-transparent hover:border-red-600 rounded-xl"
                                                title="Remove User"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
