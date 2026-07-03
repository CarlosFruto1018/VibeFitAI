import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/offline"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiWebhook = pathname.startsWith("/api/webhooks");

  if (isPublic || isApiWebhook) return NextResponse.next();

  if (!req.auth && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|manifest.webmanifest|sw.js).*)"],
};
