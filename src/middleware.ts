import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicWebRoutes = ["/login", "/forgot-password", "/reset-password", "/receipts"];
const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/webhooks",
];

const SESSION_COOKIE = "rscms_access_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Public Landing Page at root
  if (pathname === "/") {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  let bearerToken: string | null = null;
  if (authHeader) {
    const trimmed = authHeader.replace(/^Bearer\s*/i, "").trim();
    if (trimmed && trimmed !== "undefined" && trimmed !== "null") {
      bearerToken = trimmed;
    }
  }

  const token =
    request.cookies.get(SESSION_COOKIE)?.value ||
    bearerToken ||
    null;

  // If authenticated user tries to visit login/auth pages, redirect to dashboard
  if (token && (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public web routes (/login, /forgot-password, /reset-password, /receipts/[id])
  if (publicWebRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public read of payment receipt (for member receipt viewing)
  if (/^\/api\/payments\/[^/]+\/receipt$/.test(pathname)) {
    return NextResponse.next();
  }

  // Protect all other API routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication credentials." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protect all dashboard and management web routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
