import type { Metadata } from 'next';
import { DashboardPage } from './dashboard-page';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Ringkasan bisnis dan laporan',
};

export default function Page() {
  return <DashboardPage />;
}
