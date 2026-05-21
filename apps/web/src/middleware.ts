import { type NextRequest, NextResponse } from 'next/server';
import { importSPKI, jwtVerify } from 'jose';

const SESSION_COOKIE = 'sub0_session';
const LOGIN_PATH = '/login';
const DEFAULT_AUTHED = '/account/dashboard';

/**
 * Allowlist of public paths. Anything NOT matching this list requires a valid
 * session — including future cabinet routes added under `app/(app)/*`. The
 * inverted-default avoids the historical leak where new pages stayed open
 * until someone remembered to extend a PROTECTED list (ctx-security.md §2).
 *
 * Exact matches only; folder-prefix matches are listed in PUBLIC_PREFIXES.
 */
const PUBLIC_EXACT = new Set<string>([
  '/',
  '/login',
  '/registration',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/faq',
  '/contacts',
  '/reviews',
  '/legal',
]);

const PUBLIC_PREFIXES = ['/registration/', '/legal/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

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

  if (pathname === LOGIN_PATH && authed) {
    const url = req.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Everything not on the public allowlist requires a valid session.
  if (!isPublic(pathname) && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Match every request except Next internals and the API; the middleware itself
// decides what's public vs. protected via the PUBLIC_EXACT / PUBLIC_PREFIXES
// allowlist above.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
