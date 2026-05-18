import { type NextRequest, NextResponse } from 'next/server';
import { importSPKI, jwtVerify } from 'jose';

const SESSION_COOKIE = 'sub0_session';
const LOGIN_PATH = '/login';
const DEFAULT_AUTHED = '/dashboard';

// Routes inside the cabinet group (app). Server-side gate (ctx-security.md §2):
// the page is never rendered/sent to an unauthenticated visitor.
const PROTECTED = ['/dashboard', '/settings', '/subscriptions', '/calendar'];

let keyPromise: ReturnType<typeof importSPKI> | null = null;
function publicKey(): ReturnType<typeof importSPKI> {
  if (!keyPromise) {
    const pem = (process.env.AUTH_JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');
    keyPromise = importSPKI(pem, 'RS256');
  }
  return keyPromise;
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }
  try {
    const { payload } = await jwtVerify(token, await publicKey(), { algorithms: ['RS256'] });
    return payload.typ === 'access';
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const authed = await hasValidSession(req);

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === LOGIN_PATH && authed) {
    const url = req.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/subscriptions/:path*', '/calendar/:path*', '/login'],
};
