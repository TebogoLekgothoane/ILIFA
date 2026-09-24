import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ilifaRouter from "./ilifa";
import pastportRouter from "./pastport";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ilifaRouter);
router.use(pastportRouter);

export default router;
