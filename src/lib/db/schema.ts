import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  timezone: text("timezone").default("UTC"),
  emailVerified: timestamp("email_verified"),
  // Hash scrypt para login con correo/contraseña; null si solo usa Google.
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
});

// ---------------------------------------------------------------------------
// User Profiles
// ---------------------------------------------------------------------------
export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goals: text("goals").array().default([]),
  fitnessLevel: text("fitness_level").default("intermediate"), // beginner | intermediate | advanced
  preferredUnits: text("preferred_units").default("kg"),       // kg | lb
  bodyWeightKg: real("body_weight_kg"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// Exercises (global catalog)
// ---------------------------------------------------------------------------
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalName: text("canonical_name").notNull().unique(), // "bench_press"
  displayName: text("display_name").notNull(),              // "Press de Banca"
  muscleGroups: text("muscle_groups").array().default([]),
  equipment: text("equipment"),
  category: text("category").notNull().default("strength"), // strength | cardio | flexibility | other
  isCustom: boolean("is_custom").default(false),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
});

export const exerciseAliases = pgTable(
  "exercise_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),   // "press plano", "banca", "bench"
    userId: uuid("user_id").references(() => users.id), // null = global
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("alias_idx").on(t.alias)]
);

// ---------------------------------------------------------------------------
// Training Sessions
// ---------------------------------------------------------------------------
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    totalVolumeKg: real("total_volume_kg"),
    durationMin: integer("duration_min"),
    summaryText: text("summary_text"),
    locationLat: real("location_lat"),
    locationLon: real("location_lon"),
    status: text("status").notNull().default("active"), // active | closed
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("session_user_idx").on(t.userId), index("session_started_idx").on(t.startedAt)]
);

// ---------------------------------------------------------------------------
// Workout Sets (core of the system)
// ---------------------------------------------------------------------------
export const workoutSets = pgTable(
  "workout_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").references(() => exercises.id),
    exerciseName: text("exercise_name"), // fallback si no hay match en catálogo
    setNumber: integer("set_number"),
    reps: integer("reps"),
    weightKg: real("weight_kg"),
    durationSec: integer("duration_sec"),
    distanceM: real("distance_m"),
    heartRateBpm: integer("heart_rate_bpm"),
    calories: integer("calories"),
    rpe: real("rpe"), // Rate of Perceived Exertion 1-10
    notes: text("notes"),
    sourceType: text("source_type").notNull().default("text"), // audio | image | text | manual
    rawInputId: uuid("raw_input_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("set_session_idx").on(t.sessionId)]
);

// ---------------------------------------------------------------------------
// Raw Inputs (audio / image / text before processing)
// ---------------------------------------------------------------------------
export const rawInputs = pgTable(
  "raw_inputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // audio | image | text
    storageUrl: text("storage_url"),    // R2 URL
    mimeType: text("mime_type"),
    transcription: text("transcription"),
    extractedJson: jsonb("extracted_json"),
    sessionId: uuid("session_id").references(() => sessions.id),
    processedAt: timestamp("processed_at"),
    processingError: text("processing_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("raw_input_user_idx").on(t.userId), index("raw_input_session_idx").on(t.sessionId)]
);

// ---------------------------------------------------------------------------
// Personal Records
// ---------------------------------------------------------------------------
export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    metric: text("metric").notNull(), // weight_kg | reps | distance_m | duration_sec | pace_min_km
    value: real("value").notNull(),
    achievedAt: timestamp("achieved_at").notNull(),
    sessionId: uuid("session_id").references(() => sessions.id),
  },
  (t) => [index("pr_user_exercise_idx").on(t.userId, t.exerciseId)]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  sessions: many(sessions),
  rawInputs: many(rawInputs),
  personalRecords: many(personalRecords),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  workoutSets: many(workoutSets),
  rawInputs: many(rawInputs),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session: one(sessions, { fields: [workoutSets.sessionId], references: [sessions.id] }),
  exercise: one(exercises, { fields: [workoutSets.exerciseId], references: [exercises.id] }),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  aliases: many(exerciseAliases),
  workoutSets: many(workoutSets),
  personalRecords: many(personalRecords),
}));

export const personalRecordsRelations = relations(personalRecords, ({ one }) => ({
  user: one(users, { fields: [personalRecords.userId], references: [users.id] }),
  exercise: one(exercises, { fields: [personalRecords.exerciseId], references: [exercises.id] }),
  session: one(sessions, { fields: [personalRecords.sessionId], references: [sessions.id] }),
}));

export const rawInputsRelations = relations(rawInputs, ({ one }) => ({
  user: one(users, { fields: [rawInputs.userId], references: [users.id] }),
  session: one(sessions, { fields: [rawInputs.sessionId], references: [sessions.id] }),
}));

export const exerciseAliasesRelations = relations(exerciseAliases, ({ one }) => ({
  exercise: one(exercises, { fields: [exerciseAliases.exerciseId], references: [exercises.id] }),
  user: one(users, { fields: [exerciseAliases.userId], references: [users.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type RawInput = typeof rawInputs.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
