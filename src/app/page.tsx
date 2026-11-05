import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect ke halaman kasir sebagai default
  redirect('/kasir');
}
