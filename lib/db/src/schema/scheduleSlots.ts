import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scheduleSlotsTable = pgTable("schedule_slots", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScheduleSlotSchema = createInsertSchema(scheduleSlotsTable).omit({ id: true, createdAt: true });
export type InsertScheduleSlot = z.infer<typeof insertScheduleSlotSchema>;
export type ScheduleSlot = typeof scheduleSlotsTable.$inferSelect;
