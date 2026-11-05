import type { Metadata } from 'next';
import { CabangPage } from './cabang-page';

export const metadata: Metadata = {
  title: 'Cabang',
  description: 'Kelola cabang toko',
};

export default function Page() {
  return <CabangPage />;
}
