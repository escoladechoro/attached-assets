import { Router, type IRouter } from "express";
import { db, servicesTable, packagesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateServiceBody,
  UpdateServiceBody,
  GetServiceParams,
  UpdateServiceParams,
  DeleteServiceParams,
  ListServicesQueryParams,
  CreatePackageBody,
  UpdatePackageBody,
  GetPackageParams,
  UpdatePackageParams,
  DeletePackageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/services", async (req, res): Promise<void> => {
  const parsed = ListServicesQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const active = parsed.success ? parsed.data.active : undefined;

  let query = db.select().from(servicesTable);

  if (active !== undefined) {
    query = query.where(eq(servicesTable.active, active)) as typeof query;
  }

  if (search) {
    query = query.where(ilike(servicesTable.name, `%${search}%`)) as typeof query;
  }

  const services = await query.orderBy(servicesTable.name);
  const mapped = services.map(s => ({ ...s, price: parseFloat(s.price as unknown as string) }));
  res.json({ data: mapped, total: mapped.length });
});

router.post("/services", async (req, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db.insert(servicesTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
  }).returning();

  res.status(201).json({ ...service, price: parseFloat(service.price as unknown as string) });
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetServiceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id));
  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }

  res.json({ ...service, price: parseFloat(service.price as unknown as string) });
});

router.patch("/services/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateServiceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);

  const [service] = await db
    .update(servicesTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(eq(servicesTable.id, params.data.id))
    .returning();

  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }

  res.json({ ...service, price: parseFloat(service.price as unknown as string) });
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteServiceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [service] = await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id)).returning();
  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }

  res.json({ success: true, message: "Serviço removido" });
});

// Packages
router.get("/packages", async (_req, res): Promise<void> => {
  const packages = await db.select({
    id: packagesTable.id,
    name: packagesTable.name,
    description: packagesTable.description,
    serviceId: packagesTable.serviceId,
    serviceName: servicesTable.name,
    totalSessions: packagesTable.totalSessions,
    price: packagesTable.price,
    active: packagesTable.active,
    validityDays: packagesTable.validityDays,
    createdAt: packagesTable.createdAt,
  })
    .from(packagesTable)
    .leftJoin(servicesTable, eq(packagesTable.serviceId, servicesTable.id))
    .orderBy(packagesTable.name);

  const mappedPkgs = packages.map(p => ({ ...p, price: parseFloat(p.price as unknown as string), serviceName: p.serviceName ?? "" }));
  res.json({ data: mappedPkgs, total: mappedPkgs.length });
});

router.post("/packages", async (req, res): Promise<void> => {
  const parsed = CreatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db.insert(packagesTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
  }).returning();

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, pkg.serviceId));

  res.status(201).json({ ...pkg, price: parseFloat(pkg.price as unknown as string), serviceName: service?.name ?? "" });
});

router.get("/packages/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPackageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [pkg] = await db.select({
    id: packagesTable.id,
    name: packagesTable.name,
    description: packagesTable.description,
    serviceId: packagesTable.serviceId,
    serviceName: servicesTable.name,
    totalSessions: packagesTable.totalSessions,
    price: packagesTable.price,
    active: packagesTable.active,
    validityDays: packagesTable.validityDays,
    createdAt: packagesTable.createdAt,
  })
    .from(packagesTable)
    .leftJoin(servicesTable, eq(packagesTable.serviceId, servicesTable.id))
    .where(eq(packagesTable.id, params.data.id));

  if (!pkg) {
    res.status(404).json({ error: "Pacote não encontrado" });
    return;
  }

  res.json({ ...pkg, price: parseFloat(pkg.price as unknown as string), serviceName: pkg.serviceName ?? "" });
});

router.patch("/packages/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePackageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);

  const [pkg] = await db
    .update(packagesTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(eq(packagesTable.id, params.data.id))
    .returning();

  if (!pkg) {
    res.status(404).json({ error: "Pacote não encontrado" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, pkg.serviceId));
  res.json({ ...pkg, price: parseFloat(pkg.price as unknown as string), serviceName: service?.name ?? "" });
});

router.delete("/packages/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePackageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [pkg] = await db.delete(packagesTable).where(eq(packagesTable.id, params.data.id)).returning();
  if (!pkg) {
    res.status(404).json({ error: "Pacote não encontrado" });
    return;
  }

  res.json({ success: true, message: "Pacote removido" });
});

export default router;
