import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, accounts, authSessions, verificationTokens } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

// Sanear AUTH_URL antes de que NextAuth la parsee: un valor sin esquema
// (p. ej. "vibefitai.vercel.app") lanza TypeError: Invalid URL en cada
// request y tumba todo el flujo de auth en producción.
if (process.env.AUTH_URL && !/^https?:\/\//.test(process.env.AUTH_URL)) {
  process.env.AUTH_URL = `https://${process.env.AUTH_URL}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    // El adapter espera su propia forma de tabla; el schema propio difiere en tipos.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountsTable: accounts as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionsTable: authSessions as any,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        // Anti fuerza bruta: máx. 10 intentos por correo cada 5 minutos.
        // Se limita por email (no por IP) para que un atacante distribuido
        // tampoco pueda martillar una cuenta concreta.
        const rl = await checkRateLimit(`login:${email}`, "login", 10, 300);
        if (!rl.allowed) return null;

        const user = await db.query.users.findFirst({ where: eq(users.email, email) });
        // Sin passwordHash (cuenta solo-Google) se rechaza igual que una
        // contraseña incorrecta para no revelar qué cuentas existen.
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: { strategy: "jwt" },
  logger: {
    // El único síntoma visible de un fallo en el callback OAuth es
    // "error=Configuration" — sin esto, la causa real nunca llega a los logs.
    error(error: Error) {
      const cause = (error as { cause?: { err?: Error } }).cause?.err;
      console.error("[auth][error]", error.name, error.message, cause ? `| causa: ${cause.name}: ${cause.message}` : "");
    },
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
