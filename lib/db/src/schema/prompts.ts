import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  intent: text("intent"),
  expertiseLevel: text("expertise_level"),
  qualityScore: integer("quality_score"),
  copyCount: integer("copy_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  promptId: integer("prompt_id")
    .notNull()
    .references(() => promptsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promptVersionsTable = pgTable("prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id")
    .notNull()
    .references(() => promptsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  qualityScore: integer("quality_score"),
  action: text("action").notNull().default("create"),
  versionNumber: integer("version_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PromptVersion = typeof promptVersionsTable.$inferSelect;

export const insertPromptSchema = createInsertSchema(promptsTable).omit({
  id: true,
  copyCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof promptsTable.$inferSelect;
export type Favorite = typeof favoritesTable.$inferSelect;
