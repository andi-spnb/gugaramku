import type { Metadata } from 'next';
import { ProfilPage } from './profil-page';

export const metadata: Metadata = {
  title: 'Profil Saya',
  description: 'Kelola data akun, password, dan PIN',
};

export default function Page() {
  return <ProfilPage />;
}
