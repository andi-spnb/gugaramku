import type { Metadata } from 'next';
import { LabaPage } from './laba-page';

export const metadata: Metadata = {
  title: 'Laporan Laba',
  description: 'Laporan laba dan margin keuntungan',
};

export default function Page() {
  return <LabaPage />;
}
