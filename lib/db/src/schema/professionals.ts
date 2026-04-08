import { pgTable, text, serial, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const professionalsTable = pgTable("professionals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  specialty: text("specialty"),
  cpf: text("cpf"),
  cnpj: text("cnpj"),
  cep: text("cep"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  active: boolean("active").notNull().default(true),
  clinicSharePercent: numeric("clinic_share_percent", { precision: 5, scale: 2 }).notNull().default("30"),
  professionalSharePercent: numeric("professional_share_percent", { precision: 5, scale: 2 }).notNull().default("70"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProfessionalSchema = createInsertSchema(professionalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionalsTable.$inferSelect;
