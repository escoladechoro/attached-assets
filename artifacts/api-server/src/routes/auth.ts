import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }
  const token = signToken({
    id: user.id, email: user.email, role: user.role, professionalId: user.professionalId,
  });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, professionalId: user.professionalId, createdAt: user.createdAt }, token });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true, message: "Logout realizado" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: { id: number } }).user;
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  if (!dbUser) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json({ id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role, professionalId: dbUser.professionalId, createdAt: dbUser.createdAt });
});

router.post("/auth/setup", async (req, res): Promise<void> => {
  const [existingUser] = await db.select().from(usersTable).limit(1);
  if (existingUser) {
    res.status(409).json({ error: "Setup já realizado. Usuário admin já existe." });
    return;
  }
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email e password são obrigatórios" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role: "gestao" }).returning();
  const token = signToken({ id: user.id, email: user.email, role: user.role, professionalId: user.professionalId });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }, token });
});

export default router;
