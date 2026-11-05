import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Routes yang tidak perlu auth
const publicRoutes = ['/login', '/forgot-password'];

// Routes berdasarkan role
const roleRoutes: Record<string, string[]> = {
  OWNER: ['*'], // Akses semua
  ADMIN_CABANG: [
    '/kasir',
    '/produk',
    '/pelanggan',
    '/kas',
    '/laporan',
    '/retur',
    '/pengaturan',
    '/karyawan',
  ],
  KASIR: [
    '/kasir',
    '/produk',
    '/pelanggan',
    '/retur',
  ],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
  );

  // Redirect ke login jika belum login dan bukan public route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect ke kasir jika sudah login dan mengakses public route
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/kasir', nextUrl.origin));
  }

  // Cek akses berdasarkan role
  if (isLoggedIn && userRole && !isPublicRoute) {
    const allowedRoutes = roleRoutes[userRole] || [];
    
    // OWNER bisa akses semua
    if (allowedRoutes.includes('*')) {
      return NextResponse.next();
    }

    // Cek apakah route diizinkan untuk role ini
    const isAllowed = allowedRoutes.some(
      (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
    );

    if (!isAllowed) {
      // Redirect ke kasir jika tidak punya akses
      return NextResponse.redirect(new URL('/kasir', nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
