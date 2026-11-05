import type { Metadata } from 'next';
import { KaryawanPage } from './karyawan-page';

export const metadata: Metadata = {
  title: 'Karyawan',
  description: 'Kelola karyawan dan akses',
};

export default function Page() {
  return <KaryawanPage />;
}
