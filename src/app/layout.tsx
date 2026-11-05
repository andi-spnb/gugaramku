import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { SessionProvider } from '@/components/providers/session-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GuGaramKu - POS & Inventory Management',
    template: '%s | GuGaramKu',
  },
  description: 'Aplikasi POS dan Manajemen Inventory profesional untuk toko retail dan grosir',
  keywords: ['POS', 'inventory', 'kasir', 'toko', 'grosir', 'retail', 'manajemen stok'],
  authors: [{ name: 'GuGaramKu Team' }],
  creator: 'GuGaramKu',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'GuGaramKu',
    title: 'GuGaramKu - POS & Inventory Management',
    description: 'Aplikasi POS dan Manajemen Inventory profesional untuk toko retail dan grosir',
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <SessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            classNames: {
              toast: 'bg-white border shadow-lg',
              title: 'text-gray-900 font-medium',
              description: 'text-gray-500',
              success: 'border-green-200 bg-green-50',
              error: 'border-red-200 bg-red-50',
              warning: 'border-amber-200 bg-amber-50',
              info: 'border-blue-200 bg-blue-50',
            },
          }}
        />
      </body>
    </html>
  );
}
