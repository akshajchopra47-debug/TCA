import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scope3Router from "./scope3";
import scope3textRouter from "./scope3text";
import chatRouter from "./chat";
import calculateRouter from "./calculate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scope3Router);
router.use(scope3textRouter);
router.use(chatRouter);
router.use(calculateRouter);

export default router;
