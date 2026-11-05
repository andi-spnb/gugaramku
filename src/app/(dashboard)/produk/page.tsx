import type { Metadata } from 'next';
import { ProdukPage } from './produk-page';

export const metadata: Metadata = {
  title: 'Produk',
  description: 'Kelola data produk, satuan, dan harga',
};

export default function Page() {
  return <ProdukPage />;
}
