import { Router, type IRouter } from "express";
import { db, salesTable, clientsTable, professionalsTable, servicesTable, packagesTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { calculateSplit } from "../lib/split";
import {
  CreateSaleBody,
  UpdateSaleBody,
  GetSaleParams,
  UpdateSaleParams,
  ListSalesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

async function enrichSale(sale: typeof salesTable.$inferSelect) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, sale.clientId));
  const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, sale.professionalId));
  let serviceName: string | null = null;
  let packageName: string | null = null;

  if (sale.serviceId) {
    const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, sale.serviceId));
    serviceName = svc?.name ?? null;
  }
  if (sale.packageId) {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sale.packageId));
    packageName = pkg?.name ?? null;
  }

  return {
    ...sale,
    grossAmount: parseFloat(sale.grossAmount as unknown as string),
    gateFee: parseFloat(sale.gateFee as unknown as string),
    netAmount: parseFloat(sale.netAmount as unknown as string),
    clinicAmount: parseFloat(sale.clinicAmount as unknown as string),
    professionalAmount: parseFloat(sale.professionalAmount as unknown as string),
    clientName: client?.name ?? "",
    professionalName: professional?.name ?? "",
    serviceName,
    packageName,
  };
}

router.get("/sales", async (req, res): Promise<void> => {
  const parsed = ListSalesQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const filters: ReturnType<typeof and>[] = [];
  if (parsed.success) {
    if (parsed.data.startDate) filters.push(gte(salesTable.createdAt, new Date(parsed.data.startDate)));
    if (parsed.data.endDate) {
      const end = new Date(parsed.data.endDate);
      end.setHours(23, 59, 59, 999);
      filters.push(lte(salesTable.createdAt, end));
    }
    if (parsed.data.professionalId) filters.push(eq(salesTable.professionalId, parsed.data.professionalId));
    if (parsed.data.clientId) filters.push(eq(salesTable.clientId, parsed.data.clientId));
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(salesTable)
    .where(filters.length ? and(...filters) : undefined);

  const sales = await db
    .select()
    .from(salesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(salesTable.createdAt)
    .limit(limit)
    .offset(offset);

  const enriched = await Promise.all(sales.map(enrichSale));
  res.json({ data: enriched, total: countRow?.count ?? 0, page, limit });
});

router.post("/sales", async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [professional] = await db
    .select()
    .from(professionalsTable)
    .where(eq(professionalsTable.id, parsed.data.professionalId));

  const clinicShare = professional ? parseFloat(professional.clinicSharePercent as unknown as string) : 30;
  const proShare = professional ? parseFloat(professional.professionalSharePercent as unknown as string) : 70;

  const { gateFee, netAmount, clinicAmount, professionalAmount } = calculateSplit(
    parsed.data.grossAmount,
    parsed.data.paymentMethod,
    clinicShare,
    proShare
  );

  const [sale] = await db.insert(salesTable).values({
    clientId: parsed.data.clientId,
    professionalId: parsed.data.professionalId,
    serviceId: parsed.data.serviceId ?? null,
    packageId: parsed.data.packageId ?? null,
    grossAmount: String(parsed.data.grossAmount),
    paymentMethod: parsed.data.paymentMethod,
    gateFee: String(gateFee),
    netAmount: String(netAmount),
    clinicAmount: String(clinicAmount),
    professionalAmount: String(professionalAmount),
    appointmentId: parsed.data.appointmentId ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();

  const enriched = await enrichSale(sale);
  res.status(201).json(enriched);
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSaleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, params.data.id));
  if (!sale) {
    res.status(404).json({ error: "Venda não encontrada" });
    return;
  }

  const enriched = await enrichSale(sale);
  res.json(enriched);
});

router.patch("/sales/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateSaleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sale] = await db
    .update(salesTable)
    .set(parsed.data)
    .where(eq(salesTable.id, params.data.id))
    .returning();

  if (!sale) {
    res.status(404).json({ error: "Venda não encontrada" });
    return;
  }

  const enriched = await enrichSale(sale);
  res.json(enriched);
});

export default router;
