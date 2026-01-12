import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Rate limiting store (in-memory, will reset on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Public routes yang tidak perlu auth
const PUBLIC_ROUTES = ['/login', '/api/auth/callback'];
// API routes yang perlu auth
const PROTECTED_API_ROUTES = ['/api/admin', '/api/auth/login-audit'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - this will auto-refresh the session
  const { data: { session } } = await supabase.auth.getSession();

  // Protect admin, owner, controller routes
  const isProtectedRoute = pathname.startsWith('/admin') || 
                          pathname.startsWith('/owner') || 
                          pathname.startsWith('/controller') ||
                          pathname.startsWith('/account');
  
  // Protect API routes
  const isProtectedAPI = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));

  if ((isProtectedRoute || isProtectedAPI) && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check user profile and role for protected routes
  if (isProtectedRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single();

    // Block inactive users
    if (!profile?.is_active) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('error', 'inactive');
      await supabase.auth.signOut();
      return NextResponse.redirect(redirectUrl);
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/owner') && !['admin', 'owner'].includes(profile?.role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/controller') && !['admin', 'owner', 'controller'].includes(profile?.role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
