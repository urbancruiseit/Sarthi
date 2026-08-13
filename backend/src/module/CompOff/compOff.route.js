import { Router } from "express";
import { getCompOffController } from "./compOff.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
const router = Router();
router.route("/").get(verifyJWT, getCompOffController);
export default router;
