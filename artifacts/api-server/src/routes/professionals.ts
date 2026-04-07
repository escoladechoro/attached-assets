import { Router, type IRouter } from "express";
import { db, professionalsTable, scheduleSlotsTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateProfessionalBody,
  UpdateProfessionalBody,
  GetProfessionalParams,
  UpdateProfessionalParams,
  DeleteProfessionalParams,
  ListProfessionalsQueryParams,
  GetProfessionalScheduleParams,
  UpdateProfessionalScheduleParams,
  UpdateProfessionalScheduleBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/professionals", async (req, res): Promise<void> => {
  const parsed = ListProfessionalsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const active = parsed.success ? parsed.data.active : undefined;

  let query = db.select().from(professionalsTable);

  if (active !== undefined) {
    query = query.where(eq(professionalsTable.active, active)) as typeof query;
  }

  if (search) {
    query = query.where(ilike(professionalsTable.name, `%${search}%`)) as typeof query;
  }

  const professionals = await query.orderBy(professionalsTable.name);

  res.json(professionals.map(p => ({
    ...p,
    clinicSharePercent: parseFloat(p.clinicSharePercent as unknown as string),
    professionalSharePercent: parseFloat(p.professionalSharePercent as unknown as string),
  })));
});

router.post("/professionals", async (req, res): Promise<void> => {
  const parsed = CreateProfessionalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [professional] = await db.insert(professionalsTable).values({
    ...parsed.data,
    clinicSharePercent: String(parsed.data.clinicSharePercent ?? 30),
    professionalSharePercent: String(parsed.data.professionalSharePercent ?? 70),
  }).returning();

  res.status(201).json({
    ...professional,
    clinicSharePercent: parseFloat(professional.clinicSharePercent as unknown as string),
    professionalSharePercent: parseFloat(professional.professionalSharePercent as unknown as string),
  });
});

router.get("/professionals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProfessionalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, params.data.id));
  if (!professional) {
    res.status(404).json({ error: "Profissional não encontrado" });
    return;
  }

  res.json({
    ...professional,
    clinicSharePercent: parseFloat(professional.clinicSharePercent as unknown as string),
    professionalSharePercent: parseFloat(professional.professionalSharePercent as unknown as string),
  });
});

router.patch("/professionals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProfessionalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateProfessionalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.clinicSharePercent !== undefined) {
    updateData.clinicSharePercent = String(parsed.data.clinicSharePercent);
  }
  if (parsed.data.professionalSharePercent !== undefined) {
    updateData.professionalSharePercent = String(parsed.data.professionalSharePercent);
  }

  const [professional] = await db
    .update(professionalsTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(eq(professionalsTable.id, params.data.id))
    .returning();

  if (!professional) {
    res.status(404).json({ error: "Profissional não encontrado" });
    return;
  }

  res.json({
    ...professional,
    clinicSharePercent: parseFloat(professional.clinicSharePercent as unknown as string),
    professionalSharePercent: parseFloat(professional.professionalSharePercent as unknown as string),
  });
});

router.delete("/professionals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProfessionalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [professional] = await db
    .delete(professionalsTable)
    .where(eq(professionalsTable.id, params.data.id))
    .returning();

  if (!professional) {
    res.status(404).json({ error: "Profissional não encontrado" });
    return;
  }

  res.json({ success: true, message: "Profissional removido" });
});

router.get("/professionals/:id/schedule", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProfessionalScheduleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const slots = await db
    .select()
    .from(scheduleSlotsTable)
    .where(eq(scheduleSlotsTable.professionalId, params.data.id))
    .orderBy(scheduleSlotsTable.dayOfWeek, scheduleSlotsTable.startTime);

  res.json(slots);
});

router.put("/professionals/:id/schedule", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProfessionalScheduleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateProfessionalScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.delete(scheduleSlotsTable).where(eq(scheduleSlotsTable.professionalId, params.data.id));

  if (parsed.data.slots.length === 0) {
    res.json([]);
    return;
  }

  const inserted = await db
    .insert(scheduleSlotsTable)
    .values(parsed.data.slots.map(slot => ({ ...slot, professionalId: params.data.id })))
    .returning();

  res.json(inserted);
});

export default router;
