import type { Metadata } from 'next';
import { PengaturanPage } from './pengaturan-page';

export const metadata: Metadata = {
  title: 'Pengaturan',
  description: 'Pengaturan toko dan aplikasi',
};

export default function Page() {
  return <PengaturanPage />;
}
