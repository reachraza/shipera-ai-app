import DashboardLayout from '@/layouts/DashboardLayout';

export default function RFPsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
