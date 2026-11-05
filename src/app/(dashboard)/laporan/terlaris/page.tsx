import type { Metadata } from 'next';
import { TerlarisPage } from './terlaris-page';

export const metadata: Metadata = {
  title: 'Produk Terlaris',
  description: 'Analisis produk terlaris dan slow moving',
};

export default function Page() {
  return <TerlarisPage />;
}
