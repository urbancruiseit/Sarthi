import { Router } from "express";
import { getCompOffController } from "./compOff.controller.js";
const router = Router();
router.route("/").get(getCompOffController);
export default router;
