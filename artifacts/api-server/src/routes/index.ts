import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import notificationsRouter from "./notifications";
import settingsRouter from "./settings";
import statsRouter from "./stats";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(notificationsRouter);
router.use(settingsRouter);
router.use(statsRouter);
router.use(pushRouter);

export default router;
