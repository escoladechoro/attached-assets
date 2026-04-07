import { Router, type IRouter } from "express";
import { db, salesTable, appointmentsTable, clientsTable, professionalsTable, servicesTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  GetFinancialReportQueryParams,
  GetAppointmentReportQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/reports/financial", async (req, res): Promise<void> => {
  const parsed = GetFinancialReportQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startDate, endDate, professionalId, serviceId } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const filters: ReturnType<typeof and>[] = [
    gte(salesTable.createdAt, start),
    lte(salesTable.createdAt, end),
  ];

  if (professionalId) filters.push(eq(salesTable.professionalId, professionalId));
  if (serviceId) filters.push(eq(salesTable.serviceId, serviceId));

  const sales = await db
    .select()
    .from(salesTable)
    .where(and(...filters))
    .orderBy(salesTable.createdAt);

  const enrichedSales = await Promise.all(
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
        serviceName: null as string | null,
        packageName: null as string | null,
      };
    })
  );

  const totalGross = enrichedSales.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalFees = enrichedSales.reduce((sum, s) => sum + s.gateFee, 0);
  const totalNet = enrichedSales.reduce((sum, s) => sum + s.netAmount, 0);
  const totalClinic = enrichedSales.reduce((sum, s) => sum + s.clinicAmount, 0);
  const totalProfessionals = enrichedSales.reduce((sum, s) => sum + s.professionalAmount, 0);

  const methodMap: Record<string, { count: number; total: number }> = {};
  for (const s of enrichedSales) {
    if (!methodMap[s.paymentMethod]) methodMap[s.paymentMethod] = { count: 0, total: 0 };
    methodMap[s.paymentMethod].count++;
    methodMap[s.paymentMethod].total += s.grossAmount;
  }
  const byPaymentMethod = Object.entries(methodMap).map(([method, data]) => ({
    method,
    count: data.count,
    total: parseFloat(data.total.toFixed(2)),
  }));

  const professionalMap: Record<number, { name: string; appointments: number; revenue: number; professionalEarnings: number; clinicEarnings: number }> = {};
  for (const s of enrichedSales) {
    if (!professionalMap[s.professionalId]) {
      professionalMap[s.professionalId] = { name: s.professionalName, appointments: 0, revenue: 0, professionalEarnings: 0, clinicEarnings: 0 };
    }
    professionalMap[s.professionalId].appointments++;
    professionalMap[s.professionalId].revenue += s.grossAmount;
    professionalMap[s.professionalId].professionalEarnings += s.professionalAmount;
    professionalMap[s.professionalId].clinicEarnings += s.clinicAmount;
  }
  const byProfessional = Object.entries(professionalMap).map(([id, data]) => ({
    professionalId: parseInt(id),
    professionalName: data.name,
    appointments: data.appointments,
    revenue: parseFloat(data.revenue.toFixed(2)),
    professionalEarnings: parseFloat(data.professionalEarnings.toFixed(2)),
    clinicEarnings: parseFloat(data.clinicEarnings.toFixed(2)),
  }));

  const serviceMap: Record<number, { name: string; count: number; total: number }> = {};
  for (const s of enrichedSales) {
    if (!s.serviceId) continue;
    if (!serviceMap[s.serviceId]) serviceMap[s.serviceId] = { name: s.serviceName ?? "", count: 0, total: 0 };
    serviceMap[s.serviceId].count++;
    serviceMap[s.serviceId].total += s.grossAmount;
  }
  const byService = Object.entries(serviceMap).map(([id, data]) => ({
    serviceId: parseInt(id),
    serviceName: data.name,
    count: data.count,
    total: parseFloat(data.total.toFixed(2)),
  }));

  res.json({
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalNet: parseFloat(totalNet.toFixed(2)),
    totalClinic: parseFloat(totalClinic.toFixed(2)),
    totalProfessionals: parseFloat(totalProfessionals.toFixed(2)),
    byPaymentMethod,
    byProfessional,
    byService,
    salesData: enrichedSales,
  });
});

router.get("/reports/appointments", async (req, res): Promise<void> => {
  const parsed = GetAppointmentReportQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startDate, endDate, professionalId } = parsed.data;

  const filters: ReturnType<typeof and>[] = [
    gte(appointmentsTable.date, startDate),
    lte(appointmentsTable.date, endDate),
  ];

  if (professionalId) filters.push(eq(appointmentsTable.professionalId, professionalId));

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .where(and(...filters))
    .orderBy(appointmentsTable.date, appointmentsTable.startTime);

  const enriched = await Promise.all(
    appointments.map(async (appt) => {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, appt.clientId));
      const [professional] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, appt.professionalId));
      const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, appt.serviceId));
      return {
        ...appt,
        clientName: client?.name ?? "",
        professionalName: professional?.name ?? "",
        serviceName: service?.name ?? "",
      };
    })
  );

  const statusMap: Record<string, number> = {};
  const proMap: Record<number, { name: string; total: number; completed: number; cancelled: number }> = {};

  for (const a of enriched) {
    statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;

    if (!proMap[a.professionalId]) {
      proMap[a.professionalId] = { name: a.professionalName, total: 0, completed: 0, cancelled: 0 };
    }
    proMap[a.professionalId].total++;
    if (a.status === "completed") proMap[a.professionalId].completed++;
    if (a.status === "cancelled") proMap[a.professionalId].cancelled++;
  }

  const byStatus = Object.entries(statusMap).map(([status, c]) => ({ status, count: c }));
  const byProfessional = Object.entries(proMap).map(([id, data]) => ({
    professionalId: parseInt(id),
    professionalName: data.name,
    total: data.total,
    completed: data.completed,
    cancelled: data.cancelled,
  }));

  res.json({ total: enriched.length, byStatus, byProfessional, appointments: enriched });
});

export default router;
