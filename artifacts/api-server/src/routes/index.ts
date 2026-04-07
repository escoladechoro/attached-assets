import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clientsRouter from "./clients";
import professionalsRouter from "./professionals";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import salesRouter from "./sales";
import contractsRouter from "./contracts";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(clientsRouter);
router.use(professionalsRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(salesRouter);
router.use(contractsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;
