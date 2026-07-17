import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/restablecer",
  "/privacidad",
  "/terminos",
  "/api/auth",
  "/offline",
];

// Next.js 16 renombró `middleware.ts` a `proxy.ts` (runtime Node.js por defecto).
//
// Importante: aquí se verifica la cookie de sesión JWT con getToken, sin
// importar lib/auth. Importar la config completa de NextAuth arrastraría el
// cliente de base de datos (drizzle/neon) a cada request del middleware — y
// db/client.ts lanza si falta DATABASE_URL, tumbando el sitio entero con 500.
// El middleware solo necesita saber si hay sesión válida; la config completa
// vive en las rutas que sí la usan.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiWebhook = pathname.startsWith("/api/webhooks");

  if (isPublic || isApiWebhook) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
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
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|manifest.webmanifest|sw.js).*)"],
};
