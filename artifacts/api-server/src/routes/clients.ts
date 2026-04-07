import { Router, type IRouter } from "express";
import { db, clientsTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateClientBody,
  UpdateClientBody,
  GetClientParams,
  UpdateClientParams,
  DeleteClientParams,
  ListClientsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/clients", async (req, res): Promise<void> => {
  const parsed = ListClientsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const search = parsed.success ? parsed.data.search : undefined;

  const offset = (page - 1) * limit;

  let query = db.select().from(clientsTable);

  if (search) {
    query = query.where(
      or(
        ilike(clientsTable.name, `%${search}%`),
        ilike(clientsTable.email, `%${search}%`),
        ilike(clientsTable.cpf, `%${search}%`),
        ilike(clientsTable.phone, `%${search}%`)
      )
    ) as typeof query;
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clientsTable)
    .$dynamic()
    .$dynamic();

  const data = await query.limit(limit).offset(offset).orderBy(clientsTable.name);

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clientsTable);

  res.json({ data, total: totalRow?.count ?? 0, page, limit });
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(client);
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetClientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.json(client);
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateClientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .update(clientsTable)
    .set(parsed.data)
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.json(client);
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteClientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [client] = await db
    .delete(clientsTable)
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.json({ success: true, message: "Cliente removido" });
});

export default router;
