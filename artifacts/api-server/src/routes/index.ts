import { Router, type IRouter } from "express";
import healthRouter from "./health";
import worksheetRouter from "./worksheet/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/worksheet", worksheetRouter);

export default router;
