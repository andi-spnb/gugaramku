import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Masuk ke aplikasi GuGaramKu',
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
          <h1 className="text-3xl font-bold text-primary">GuGaramKu</h1>
          <p className="mt-2 text-sm text-gray-600">
            POS & Inventory Management
          </p>
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}
