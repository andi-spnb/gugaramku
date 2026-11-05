import type { Metadata } from 'next';
import { PelangganPage } from './pelanggan-page';

export const metadata: Metadata = {
  title: 'Pelanggan',
  description: 'Kelola data pelanggan',
};

export default function Page() {
  return <PelangganPage />;
}
