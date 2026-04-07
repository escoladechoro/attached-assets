import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  professionalId: integer("professional_id").notNull(),
  packageId: integer("package_id").notNull(),
  saleId: integer("sale_id"),
  totalSessions: integer("total_sessions").notNull(),
  usedSessions: integer("used_sessions").notNull().default(0),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
  expiresAt: date("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const contractSessionsTable = pgTable("contract_sessions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  appointmentId: integer("appointment_id"),
  sessionNumber: integer("session_number").notNull(),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractsTable.$inferSelect;

export const insertContractSessionSchema = createInsertSchema(contractSessionsTable).omit({ id: true, createdAt: true });
export type InsertContractSession = z.infer<typeof insertContractSessionSchema>;
export type ContractSession = typeof contractSessionsTable.$inferSelect;
