import type { Metadata } from 'next';
import { AktivitasPage } from './aktivitas-page';

export const metadata: Metadata = {
  title: 'Log Aktivitas',
  description: 'Audit trail aktivitas pengguna',
};

export default function Page() {
  return <AktivitasPage />;
}
