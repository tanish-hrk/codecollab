import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Use the secret from auth options
  const token = await getToken({
    req: request,
    secret: "91e69a7a2e702e848ded6e3aea3e2926a529a02a7c4e9e88ea38645aa4ccddae",
  })

  const isAuthenticated = !!token

  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/signup", "/demo"]
  const isPublicPath = publicPaths.some((publicPath) => path === publicPath || path.startsWith(publicPath + "/"))

  // API routes should be excluded from middleware
  if (path.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login if they're trying to access protected routes
  if (!isAuthenticated && !isPublicPath && !path.startsWith("/_next")) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup pages
  if (isAuthenticated && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /static (static files)
     * 3. /favicon.ico, /robots.txt (static files)
     */
    "/((?!_next|static|favicon.ico|robots.txt).*)",
  ],
}

