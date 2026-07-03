import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks de auth y db para probar el flujo de borrado sin base de datos real.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

const deletedTables: unknown[] = [];
const updatedTables: unknown[] = [];

vi.mock("@/lib/db/client", () => {
  const makeThenable = (result: unknown) => ({
    where: vi.fn().mockResolvedValue(result),
  });
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => makeThenable([{ id: "sesion-1" }, { id: "sesion-2" }])),
      })),
      delete: vi.fn((table: unknown) => {
        deletedTables.push(table);
        return makeThenable(undefined);
      }),
      update: vi.fn((table: unknown) => {
        updatedTables.push(table);
        return { set: vi.fn(() => makeThenable(undefined)) };
      }),
    },
  };
});

import { DELETE } from "./route";
import { auth } from "@/lib/auth";
import {
  users, accounts, authSessions, userProfiles,
  sessions, workoutSets, rawInputs, personalRecords,
  exerciseAliases, exercises,
} from "@/lib/db/schema";

describe("DELETE /api/account", () => {
  beforeEach(() => {
    deletedTables.length = 0;
    updatedTables.length = 0;
  });

  it("devuelve 401 sin sesión", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(deletedTables).toHaveLength(0);
  });

  it("borra todas las tablas del usuario en orden seguro para las FKs", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const res = await DELETE();
    expect(res.status).toBe(200);

    // Todas las tablas con datos del usuario deben borrarse.
    expect(deletedTables).toEqual([
      workoutSets,
      personalRecords,
      rawInputs,
      sessions,
      userProfiles,
      exerciseAliases,
      accounts,
      authSessions,
      users,
    ]);

    // Los ejercicios custom se desvinculan (no se borran, son catálogo global).
    expect(updatedTables).toEqual([exercises]);

    // users debe ser lo último: sus FKs dependen de todo lo anterior.
    expect(deletedTables[deletedTables.length - 1]).toBe(users);
  });
});
