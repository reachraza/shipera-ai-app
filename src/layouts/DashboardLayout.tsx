'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Truck,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Users,
  Menu
} from 'lucide-react';

import ForcePasswordUpdate from '@/components/ForcePasswordUpdate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems: { name: string; href: string; icon: any; adminOnly?: boolean }[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Carriers', href: '/carriers', icon: Truck },
    { name: 'RFPs', href: '/rfps', icon: FileText },
    // { name: 'Teams', href: '/teams', icon: Users, adminOnly: true },
  ];

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <ForcePasswordUpdate />

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-80' : 'w-24'
          } bg-card/40 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-500 ease-in-out relative z-30 group`}
      >
        <div className="p-8 flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="Shipera Logo"
              fill
              className="object-contain drop-shadow-lg rounded-full"
              priority
            />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-foreground whitespace-nowrap leading-none">
                SHIPERA<span className="text-primary">.AI</span>
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Logistics OS</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            // If the item is marked as adminOnly and the current user isn't an admin, hide it from the sidebar
            if (item.adminOnly && appUser?.role !== 'admin') {
              return null;
            }

            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center ${isSidebarOpen ? 'px-5' : 'justify-center'} py-4 rounded-2xl font-bold transition-all duration-300 group ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Icon size={22} className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                {isSidebarOpen && <span className="ml-4">{item.name}</span>}
                {isSidebarOpen && isActive && <ChevronRight className="ml-auto opacity-60" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-muted/20 border-t border-border mt-auto">
          {isSidebarOpen && (
            <div className="flex items-center gap-4 px-4 py-4 mb-4 bg-card/50 rounded-2xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent ring-2 ring-accent/10">
                <UserIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{appUser?.full_name || appUser?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
                  {appUser?.role || 'Portal'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/settings')}
              className={`w-full flex items-center ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} py-3 rounded-xl text-sm font-bold transition-all group ${pathname.startsWith('/settings')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <Settings size={20} className={`transition-transform ${pathname.startsWith('/settings') ? 'rotate-45' : 'group-hover:rotate-45'}`} />
              {isSidebarOpen && <span className="ml-4">Settings</span>}
            </button>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} py-3 rounded-xl text-sm font-bold text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-all group`}
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              {isSidebarOpen && <span className="ml-4">Logout</span>}
            </button>
          </div>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all opacity-0 group-hover:opacity-100 shadow-sm"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-6 sm:p-10 relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>

        {/* Background Decors */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10" />
      </main>
    </div>
  );
}
