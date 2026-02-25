'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Settings, User, Building, ShieldCheck, Mail, Save, KeyRound, Edit2 } from 'lucide-react';
import { createClient } from '@/config/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
    const { appUser, signOut, updateProfile } = useAuth();
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form states
    const [newPassword, setNewPassword] = useState('');
    const [orgName, setOrgName] = useState('Loading...');
    const [fullName, setFullName] = useState('');
    const [hasLoadedName, setHasLoadedName] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [orgLoading, setOrgLoading] = useState(false);
    const [orgSuccess, setOrgSuccess] = useState('');
    const [orgError, setOrgError] = useState('');
    const [isEditingOrg, setIsEditingOrg] = useState(false);

    useEffect(() => {
        if (appUser?.full_name && !hasLoadedName) {
            setFullName(appUser.full_name);
            setHasLoadedName(true);
        }
    }, [appUser, hasLoadedName]);

    useEffect(() => {
        async function fetchOrgName() {
            if (!appUser?.org_id) return;

            const { data, error } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', appUser.org_id)
                .single();

            if (data) setOrgName(data.name);
        }

        fetchOrgName();
    }, [appUser, supabase]);

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setSuccess('Password updated successfully!');
            setNewPassword('');
        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    }

    async function handleProfileUpdate(e: React.FormEvent) {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const { error: dbError } = await supabase
                .from('users')
                .update({ full_name: fullName })
                .eq('id', appUser?.id);

            if (dbError) throw dbError;

            updateProfile({ full_name: fullName });
            setProfileSuccess('Profile updated successfully! Changes are applied instantly.');
            setIsEditingProfile(false);
        } catch (err) {
            const error = err as Error;
            setProfileError(error.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    }

    async function handleOrgUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (appUser?.role !== 'admin') return;

        setOrgLoading(true);
        setOrgError('');
        setOrgSuccess('');

        try {
            const { error: dbError } = await supabase
                .from('organizations')
                .update({ name: orgName })
                .eq('id', appUser?.org_id);

            if (dbError) throw dbError;

            setOrgSuccess('Organization name updated successfully!');
            setIsEditingOrg(false);
        } catch (err) {
            const error = err as Error;
            setOrgError(error.message || 'Failed to update organization name');
        } finally {
            setOrgLoading(false);
        }
    }

    if (!appUser) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3 border border-primary/20">
                        <Settings size={16} />
                        Preferences
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium max-w-xl">
                        Manage your personal profile, security credentials, and view organization details.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Nav */}
                <div className="glass-panel p-4 rounded-2xl h-fit space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <User size={18} /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('organization')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === 'organization' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <Building size={18} /> Organization
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === 'security' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <KeyRound size={18} /> Security
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <div className="glass-panel p-6 sm:p-8 rounded-2xl min-h-[400px]">

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground mb-1">Personal Profile</h2>
                                    <p className="text-sm text-muted-foreground">Your personal contact information and identity.</p>
                                </div>

                                <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="h-20 w-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-black border-2 border-primary/30 shadow-inner uppercase">
                                            {(appUser.full_name || appUser.email || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground capitalize">{appUser.full_name || appUser.email?.split('@')[0]}</h3>
                                            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
                                                <ShieldCheck size={14} className="text-primary" /> {appUser.role.toUpperCase()}
                                            </p>
                                        </div>
                                        {!isEditingProfile && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditingProfile(true)}
                                                className="ml-auto gap-2 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:border-primary/50 text-primary bg-primary/5"
                                            >
                                                <Edit2 size={14} />
                                                Edit Profile
                                            </Button>
                                        )}
                                    </div>

                                    {isEditingProfile ? (
                                        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md mt-8">
                                            {profileError && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
                                                    {profileError}
                                                </div>
                                            )}
                                            {profileSuccess && (
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium">
                                                    {profileSuccess}
                                                </div>
                                            )}
                                            <div className="space-y-1.5">
                                                <Input
                                                    label="Full Name"
                                                    icon={<User size={16} />}
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Input
                                                    label="Email Address"
                                                    icon={<Mail size={16} />}
                                                    type="email"
                                                    disabled
                                                    value={appUser.email || ''}
                                                    className="opacity-70 cursor-not-allowed"
                                                />
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Email cannot be changed.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    type="submit"
                                                    disabled={profileLoading || !fullName || fullName === (appUser.full_name || '')}
                                                    isLoading={profileLoading}
                                                    className="gap-2"
                                                >
                                                    {!profileLoading && <Save size={18} />}
                                                    Update Profile
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditingProfile(false);
                                                        setFullName(appUser.full_name || '');
                                                    }}
                                                    className="font-bold border-transparent hover:bg-muted"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-4 max-w-md mt-8">
                                            {profileSuccess && (
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium">
                                                    {profileSuccess}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-4 bg-background rounded-xl border border-border">
                                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Full Name</h3>
                                                    <p className="font-bold text-foreground">{appUser.full_name || 'Not set'}</p>
                                                </div>
                                                <div className="p-4 bg-background rounded-xl border border-border">
                                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Email Address</h3>
                                                    <p className="font-bold text-foreground opacity-70">{appUser.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Organization Tab */}
                        {activeTab === 'organization' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground mb-1">Organization Details</h2>
                                    <p className="text-sm text-muted-foreground">Information about the company you are linked to.</p>
                                </div>

                                <div className="bg-muted/30 p-6 rounded-2xl border border-border space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border flex-1">
                                            <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                                                <Building size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Company Name</h3>
                                                <p className="text-xl font-black text-foreground tracking-tight">{orgName}</p>
                                            </div>
                                        </div>
                                        {appUser.role === 'admin' && !isEditingOrg && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditingOrg(true)}
                                                className="ml-4 gap-2 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:border-primary/50 text-primary bg-primary/5"
                                            >
                                                <Edit2 size={14} />
                                                Edit Name
                                            </Button>
                                        )}
                                    </div>

                                    {isEditingOrg ? (
                                        <form onSubmit={handleOrgUpdate} className="space-y-4 max-w-md animate-in slide-in-from-top-2 duration-200">
                                            {orgError && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
                                                    {orgError}
                                                </div>
                                            )}
                                            <div className="space-y-1.5">
                                                <Input
                                                    label="New Company Name"
                                                    icon={<Building size={16} />}
                                                    type="text"
                                                    required
                                                    value={orgName}
                                                    onChange={(e) => setOrgName(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex gap-3">
                                                <Button
                                                    type="submit"
                                                    disabled={orgLoading || !orgName}
                                                    isLoading={orgLoading}
                                                    className="gap-2"
                                                >
                                                    {!orgLoading && <Save size={18} />}
                                                    Update Organization
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    type="button"
                                                    onClick={() => setIsEditingOrg(false)}
                                                    className="font-bold border-transparent hover:bg-muted"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        orgSuccess && (
                                            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium max-w-md">
                                                {orgSuccess}
                                            </div>
                                        )
                                    )}

                                    <div className="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-background rounded-xl border border-border">
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Role</h3>
                                            <p className="font-bold text-foreground capitalize flex items-center gap-2">
                                                {appUser.role === 'admin' ? <ShieldCheck size={16} className="text-primary" /> : null}
                                                {appUser.role}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-background rounded-xl border border-border">
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Org ID</h3>
                                            <p className="font-mono text-xs text-muted-foreground">{appUser.org_id}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground mb-1">Security Settings</h2>
                                    <p className="text-sm text-muted-foreground">Manage your password to secure your account.</p>
                                </div>

                                <form onSubmit={handlePasswordChange} className="bg-muted/30 p-6 rounded-2xl border border-border space-y-6 max-w-md">

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium">
                                            {success}
                                        </div>
                                    )}

                                    <Input
                                        label="New Password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />

                                    <Button
                                        type="submit"
                                        disabled={loading || !newPassword}
                                        isLoading={loading}
                                        className="w-full gap-2"
                                    >
                                        {!loading && <Save size={18} />}
                                        Update Password
                                    </Button>
                                </form>

                                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl max-w-md">
                                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">Logging out will terminate your current session immediately.</p>
                                    <Button
                                        variant="destructive"
                                        onClick={signOut}
                                    >
                                        Log out of all devices
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
