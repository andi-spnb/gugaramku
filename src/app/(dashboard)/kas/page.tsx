import type { Metadata } from 'next';
import { KasPage } from './kas-page';

export const metadata: Metadata = {
  title: 'Kas',
  description: 'Kelola kas masuk dan keluar',
};

export default function Page() {
  return <KasPage />;
}
