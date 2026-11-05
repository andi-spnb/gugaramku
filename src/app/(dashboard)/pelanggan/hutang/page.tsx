import type { Metadata } from 'next';
import { HutangPage } from './hutang-page';

export const metadata: Metadata = {
  title: 'Hutang',
  description: 'Kelola hutang pelanggan',
};

export default function Page() {
  return <HutangPage />;
}
