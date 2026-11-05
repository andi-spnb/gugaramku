import type { Metadata } from 'next';
import { StokPage } from './stok-page';

export const metadata: Metadata = {
  title: 'Stok',
  description: 'Kelola stok produk',
};

export default function Page() {
  return <StokPage />;
}
