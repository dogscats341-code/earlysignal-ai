import { Router, type IRouter } from "express";
import workspaceRouter from "./earlysignal";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspaceRouter);

export default router;