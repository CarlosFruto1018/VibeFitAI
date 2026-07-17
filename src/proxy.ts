import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/restablecer", "/api/auth", "/offline"];

// Next.js 16 renombró `middleware.ts` a `proxy.ts`. Además de la convención,
// el cambio es funcional: proxy.ts corre en runtime Node.js por defecto,
// mientras que middleware.ts seguía forzado a Edge (que no soporta el
// módulo `crypto` de Node usado por lib/password.ts para el login con
// correo/contraseña).
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiWebhook = pathname.startsWith("/api/webhooks");

  if (isPublic || isApiWebhook) return NextResponse.next();

  if (!req.auth) {
    // Las APIs responden 401 en JSON; redirigir un fetch a /login solo
    // devuelve HTML con status 200 y confunde al cliente.
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|manifest.webmanifest|sw.js).*)"],
};
