import { Router, type IRouter } from "express";
import healthRouter from "./health";
import promptsRouter from "./prompts";
import favoritesRouter from "./favorites";
import templatesRouter from "./templates";
import categoriesRouter from "./categories";
import statsRouter from "./stats";
import paymentsRouter from "./payments";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(promptsRouter);
router.use(favoritesRouter);
router.use(templatesRouter);
router.use(categoriesRouter);
router.use(statsRouter);
router.use(paymentsRouter);
router.use(adminRouter);

export default router;
