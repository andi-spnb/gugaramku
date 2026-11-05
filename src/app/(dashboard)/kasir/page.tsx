import type { Metadata } from 'next';
import { KasirPage } from './kasir-page';

export const metadata: Metadata = {
  title: 'Kasir',
  description: 'Point of Sale - Proses transaksi penjualan',
};

export default function Page() {
  return <KasirPage />;
}
