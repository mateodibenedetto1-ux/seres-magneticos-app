import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, firma } from './lib/session';

export async function middleware(req: NextRequest) {
  const esperada = await firma();
  if (!esperada) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/login')) return NextResponse.next();
  if (req.cookies.get(COOKIE)?.value === esperada) return NextResponse.next();
  const to = req.nextUrl.clone();
  to.pathname = '/login';
  to.search = '';
  return NextResponse.redirect(to);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)'],
};
