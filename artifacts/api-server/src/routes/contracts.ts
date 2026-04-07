import { Router, type IRouter } from "express";
import { db, contractsTable, contractSessionsTable, clientsTable, professionalsTable, packagesTable, servicesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateContractBody,
  UpdateContractBody,
  GetContractParams,
  UpdateContractParams,
  ListContractsQueryParams,
  ListContractSessionsParams,
  AddContractSessionParams,
  AddContractSessionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

async function enrichContract(c: typeof contractsTable.$inferSelect) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, c.clientId));
  const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, c.professionalId));
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, c.packageId));
  let serviceName = "";
  if (pkg) {
    const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, pkg.serviceId));
    serviceName = svc?.name ?? "";
  }

  return {
    ...c,
    clientName: client?.name ?? "",
    professionalName: professional?.name ?? "",
    packageName: pkg?.name ?? "",
    serviceId: pkg?.serviceId ?? 0,
    serviceName,
    remainingSessions: c.totalSessions - c.usedSessions,
  };
}

router.get("/contracts", async (req, res): Promise<void> => {
  const parsed = ListContractsQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof and>[] = [];

  if (parsed.success) {
    if (parsed.data.clientId) filters.push(eq(contractsTable.clientId, parsed.data.clientId));
    if (parsed.data.professionalId) filters.push(eq(contractsTable.professionalId, parsed.data.professionalId));
    if (parsed.data.status) filters.push(eq(contractsTable.status, parsed.data.status));
  }

  const contracts = await db
    .select()
    .from(contractsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(contractsTable.createdAt);

  const enriched = await Promise.all(contracts.map(enrichContract));
  res.json({ data: enriched, total: enriched.length });
});

router.post("/contracts", async (req, res): Promise<void> => {
  const parsed = CreateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, parsed.data.packageId));
  if (!pkg) {
    res.status(404).json({ error: "Pacote não encontrado" });
    return;
  }

  const expiresAt = pkg.validityDays
    ? new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : null;

  const [contract] = await db.insert(contractsTable).values({
    clientId: parsed.data.clientId,
    professionalId: parsed.data.professionalId,
    packageId: parsed.data.packageId,
    saleId: parsed.data.saleId ?? null,
    totalSessions: pkg.totalSessions,
    notes: parsed.data.notes ?? null,
    expiresAt,
  }).returning();

  const enriched = await enrichContract(contract);
  res.status(201).json(enriched);
});

router.get("/contracts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetContractParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id));
  if (!contract) {
    res.status(404).json({ error: "Contrato não encontrado" });
    return;
  }

  const enriched = await enrichContract(contract);
  res.json(enriched);
});

router.patch("/contracts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateContractParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contract] = await db
    .update(contractsTable)
    .set(parsed.data)
    .where(eq(contractsTable.id, params.data.id))
    .returning();

  if (!contract) {
    res.status(404).json({ error: "Contrato não encontrado" });
    return;
  }

  const enriched = await enrichContract(contract);
  res.json(enriched);
});

router.get("/contracts/:id/sessions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListContractSessionsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const sessions = await db
    .select()
    .from(contractSessionsTable)
    .where(eq(contractSessionsTable.contractId, params.data.id))
    .orderBy(contractSessionsTable.sessionNumber);

  res.json(sessions);
});

router.post("/contracts/:id/sessions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddContractSessionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = AddContractSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id));
  if (!contract) {
    res.status(404).json({ error: "Contrato não encontrado" });
    return;
  }

  if (contract.usedSessions >= contract.totalSessions) {
    res.status(400).json({ error: "Todas as sessões já foram utilizadas" });
    return;
  }

  const sessionNumber = contract.usedSessions + 1;

  const [session] = await db.insert(contractSessionsTable).values({
    contractId: params.data.id,
    appointmentId: parsed.data.appointmentId ?? null,
    sessionNumber,
    performedAt: new Date(parsed.data.performedAt),
    notes: parsed.data.notes ?? null,
  }).returning();

  const newUsed = contract.usedSessions + 1;
  const newStatus = newUsed >= contract.totalSessions ? "completed" : "active";

  await db.update(contractsTable).set({ usedSessions: newUsed, status: newStatus }).where(eq(contractsTable.id, params.data.id));

  res.status(201).json(session);
});

export default router;
