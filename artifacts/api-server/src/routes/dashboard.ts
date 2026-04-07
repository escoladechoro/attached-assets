import { Router, type IRouter } from "express";
import { db, appointmentsTable, salesTable, clientsTable, contractsTable, professionalsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  GetDashboardSummaryQueryParams,
  GetRecentSalesQueryParams,
  GetProfessionalStatsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const parsed = GetDashboardSummaryQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "today") : "today";

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  if (period === "today") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        gte(appointmentsTable.date, startStr),
        lte(appointmentsTable.date, endStr)
      )
    );

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === "completed").length;
  const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;

  const salesData = await db
    .select()
    .from(salesTable)
    .where(
      and(
        gte(salesTable.createdAt, startDate),
        lte(salesTable.createdAt, endDate)
      )
    );

  const totalRevenue = salesData.reduce((sum, s) => sum + parseFloat(s.grossAmount as unknown as string), 0);
  const clinicRevenue = salesData.reduce((sum, s) => sum + parseFloat(s.clinicAmount as unknown as string), 0);
  const professionalRevenue = salesData.reduce((sum, s) => sum + parseFloat(s.professionalAmount as unknown as string), 0);

  const [newClientsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clientsTable)
    .where(
      and(
        gte(clientsTable.createdAt, startDate),
        lte(clientsTable.createdAt, endDate)
      )
    );

  const [activeContractsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contractsTable)
    .where(eq(contractsTable.status, "active"));

  res.json({
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    clinicRevenue: parseFloat(clinicRevenue.toFixed(2)),
    professionalRevenue: parseFloat(professionalRevenue.toFixed(2)),
    newClients: newClientsRow?.count ?? 0,
    activeContracts: activeContractsRow?.count ?? 0,
  });
});

router.get("/dashboard/today-appointments", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.date, today))
    .orderBy(appointmentsTable.startTime);

  const enriched = await Promise.all(
    appointments.map(async (appt) => {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, appt.clientId));
      const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, appt.professionalId));
      return {
        ...appt,
        clientName: client?.name ?? "",
        professionalName: professional?.name ?? "",
        serviceName: "",
      };
    })
  );

  res.json(enriched);
});

router.get("/dashboard/recent-sales", async (req, res): Promise<void> => {
  const parsed = GetRecentSalesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const sales = await db
    .select()
    .from(salesTable)
    .orderBy(salesTable.createdAt)
    .limit(limit);

  const enriched = await Promise.all(
    sales.map(async (sale) => {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, sale.clientId));
      const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, sale.professionalId));
      return {
        ...sale,
        grossAmount: parseFloat(sale.grossAmount as unknown as string),
        gateFee: parseFloat(sale.gateFee as unknown as string),
        netAmount: parseFloat(sale.netAmount as unknown as string),
        clinicAmount: parseFloat(sale.clinicAmount as unknown as string),
        professionalAmount: parseFloat(sale.professionalAmount as unknown as string),
        clientName: client?.name ?? "",
        professionalName: professional?.name ?? "",
        serviceName: null,
        packageName: null,
      };
    })
  );

  res.json(enriched);
});

router.get("/dashboard/professional-stats", async (req, res): Promise<void> => {
  const parsed = GetProfessionalStatsQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "month") : "month";

  const now = new Date();
  let startDate: Date;

  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const professionals = await db.select().from(professionalsTable).where(eq(professionalsTable.active, true));

  const stats = await Promise.all(
    professionals.map(async (professional) => {
      const appointments = await db
        .select()
        .from(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.professionalId, professional.id),
            gte(appointmentsTable.date, startDate.toISOString().split("T")[0])
          )
        );

      const sales = await db
        .select()
        .from(salesTable)
        .where(
          and(
            eq(salesTable.professionalId, professional.id),
            gte(salesTable.createdAt, startDate)
          )
        );

      const revenue = sales.reduce((sum, s) => sum + parseFloat(s.grossAmount as unknown as string), 0);
      const professionalEarnings = sales.reduce((sum, s) => sum + parseFloat(s.professionalAmount as unknown as string), 0);
      const clinicEarnings = sales.reduce((sum, s) => sum + parseFloat(s.clinicAmount as unknown as string), 0);

      return {
        professionalId: professional.id,
        professionalName: professional.name,
        appointments: appointments.length,
        revenue: parseFloat(revenue.toFixed(2)),
        professionalEarnings: parseFloat(professionalEarnings.toFixed(2)),
        clinicEarnings: parseFloat(clinicEarnings.toFixed(2)),
      };
    })
  );

  res.json(stats);
});

export default router;
