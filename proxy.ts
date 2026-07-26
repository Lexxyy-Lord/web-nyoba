import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/admin"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!protectedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }
  if (!request.cookies.get("otpmarket_session")?.value) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
