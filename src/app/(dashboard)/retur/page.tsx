import type { Metadata } from 'next';
import { ReturPage } from './retur-page';

export const metadata: Metadata = {
  title: 'Retur',
  description: 'Kelola retur barang',
};

export default function Page() {
  return <ReturPage />;
}
