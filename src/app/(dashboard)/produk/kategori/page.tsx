import type { Metadata } from 'next';
import { KategoriPage } from './kategori-page';

export const metadata: Metadata = {
  title: 'Kategori',
  description: 'Kelola kategori produk',
};

export default function Page() {
  return <KategoriPage />;
}
