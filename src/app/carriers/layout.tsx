import DashboardLayout from '@/layouts/DashboardLayout';

export default function CarriersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
