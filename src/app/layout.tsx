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
    default: 'TK.HAMZAH - POS & Inventory Management',
    template: '%s | TK.HAMZAH',
  },
  description: 'Aplikasi POS dan Manajemen Inventory profesional untuk toko retail dan grosir',
  keywords: ['POS', 'inventory', 'kasir', 'toko', 'grosir', 'retail', 'manajemen stok'],
  authors: [{ name: 'TK.HAMZAH Team' }],
  creator: 'TK.HAMZAH',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'TK.HAMZAH',
    title: 'TK.HAMZAH - POS & Inventory Management',
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
          position="top-center"
          offset={16}
          gap={8}
          visibleToasts={3}
          toastOptions={{
            duration: 2500,
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
