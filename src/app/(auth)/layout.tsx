import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Masuk ke aplikasi TK.HAMZAH',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="TK.HAMZAH"
            width={240}
            height={80}
            className="mx-auto"
          />
          <h1 className="mt-3 text-3xl font-bold text-primary">TK.HAMZAH</h1>
          <p className="mt-2 text-sm text-gray-600">
            jl. gunung bawakaraeng. pasar sinjai block A2
          </p>
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}
