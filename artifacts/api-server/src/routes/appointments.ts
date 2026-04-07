import { Router, type IRouter } from "express";
import { db, appointmentsTable, clientsTable, professionalsTable, servicesTable, scheduleSlotsTable } from "@workspace/db";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentParams,
  DeleteAppointmentParams,
  ListAppointmentsQueryParams,
  GetAvailableSlotsQueryParams,
  BlockAppointmentSlotParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

async function enrichAppointment(appt: typeof appointmentsTable.$inferSelect) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, appt.clientId));
  const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, appt.professionalId));
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, appt.serviceId));
  return {
    ...appt,
    clientName: client?.name ?? "",
    professionalName: professional?.name ?? "",
    serviceName: service?.name ?? "",
  };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof and>[] = [];

  if (parsed.success) {
    if (parsed.data.date) filters.push(eq(appointmentsTable.date, parsed.data.date));
    if (parsed.data.professionalId) filters.push(eq(appointmentsTable.professionalId, parsed.data.professionalId));
    if (parsed.data.clientId) filters.push(eq(appointmentsTable.clientId, parsed.data.clientId));
    if (parsed.data.status) filters.push(eq(appointmentsTable.status, parsed.data.status));
    if (parsed.data.startDate) filters.push(gte(appointmentsTable.date, parsed.data.startDate));
    if (parsed.data.endDate) filters.push(lte(appointmentsTable.date, parsed.data.endDate));
  }

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(appointmentsTable.date, appointmentsTable.startTime);

  const enriched = await Promise.all(appointments.map(enrichAppointment));
  res.json({ data: enriched, total: enriched.length });
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsed.data.serviceId));
  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }

  const endTime = addMinutes(parsed.data.startTime, service.durationMinutes);

  const existing = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.professionalId, parsed.data.professionalId),
        eq(appointmentsTable.date, parsed.data.date),
        or(
          and(
            lte(appointmentsTable.startTime, parsed.data.startTime),
            gte(appointmentsTable.endTime, endTime)
          ),
          and(
            gte(appointmentsTable.startTime, parsed.data.startTime),
            lte(appointmentsTable.startTime, endTime)
          )
        )
      )
    );

  const conflicts = existing.filter(a => !["cancelled", "no_show"].includes(a.status));
  if (conflicts.length > 0) {
    res.status(409).json({ error: "Horário já ocupado para este profissional" });
    return;
  }

  const [appt] = await db
    .insert(appointmentsTable)
    .values({ ...parsed.data, endTime })
    .returning();

  const enriched = await enrichAppointment(appt);
  res.status(201).json(enriched);
});

router.get("/appointments/available-slots", async (req, res): Promise<void> => {
  const parsed = GetAvailableSlotsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { professionalId, date, serviceId } = parsed.data;

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getUTCDay();

  const scheduleSlots = await db
    .select()
    .from(scheduleSlotsTable)
    .where(
      and(
        eq(scheduleSlotsTable.professionalId, professionalId),
        eq(scheduleSlotsTable.dayOfWeek, dayOfWeek)
      )
    );

  if (scheduleSlots.length === 0) {
    res.json([]);
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }

  const bookedAppts = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.professionalId, professionalId),
        eq(appointmentsTable.date, date)
      )
    );

  const bookedSlots = bookedAppts.filter(a => !["cancelled", "no_show"].includes(a.status));

  const available: string[] = [];
  const intervalMins = service.durationMinutes;

  for (const slot of scheduleSlots) {
    let current = slot.startTime;
    while (addMinutes(current, intervalMins) <= slot.endTime) {
      const slotEnd = addMinutes(current, intervalMins);
      const isBooked = bookedSlots.some(b => {
        return b.startTime < slotEnd && b.endTime > current;
      });
      if (!isBooked) {
        available.push(current);
      }
      current = addMinutes(current, intervalMins);
    }
  }

  res.json(available);
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!appt) {
    res.status(404).json({ error: "Agendamento não encontrado" });
    return;
  }

  const enriched = await enrichAppointment(appt);
  res.json(enriched);
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appt] = await db
    .update(appointmentsTable)
    .set(parsed.data)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appt) {
    res.status(404).json({ error: "Agendamento não encontrado" });
    return;
  }

  const enriched = await enrichAppointment(appt);
  res.json(enriched);
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [appt] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!appt) {
    res.status(404).json({ error: "Agendamento não encontrado" });
    return;
  }

  res.json({ success: true, message: "Agendamento removido" });
});

router.post("/appointments/:id/block", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = BlockAppointmentSlotParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [appt] = await db
    .update(appointmentsTable)
    .set({ status: "blocked" })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appt) {
    res.status(404).json({ error: "Agendamento não encontrado" });
    return;
  }

  const enriched = await enrichAppointment(appt);
  res.json(enriched);
});

export default router;
