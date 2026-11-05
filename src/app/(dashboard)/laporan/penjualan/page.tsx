import type { Metadata } from 'next';
import { PenjualanPage } from './penjualan-page';

export const metadata: Metadata = {
  title: 'Laporan Penjualan',
  description: 'Laporan detail penjualan',
};

export default function Page() {
  return <PenjualanPage />;
}
