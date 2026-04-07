import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  professionalId: integer("professional_id").notNull(),
  serviceId: integer("service_id"),
  packageId: integer("package_id"),
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: ["pix", "credit", "debit", "cash"] }).notNull(),
  gateFee: numeric("gate_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
  clinicAmount: numeric("clinic_amount", { precision: 10, scale: 2 }).notNull(),
  professionalAmount: numeric("professional_amount", { precision: 10, scale: 2 }).notNull(),
  appointmentId: integer("appointment_id"),
  contractId: integer("contract_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
