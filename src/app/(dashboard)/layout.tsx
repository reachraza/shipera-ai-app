import DashboardLayout from '@/layouts/DashboardLayout';

export default function AppDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
