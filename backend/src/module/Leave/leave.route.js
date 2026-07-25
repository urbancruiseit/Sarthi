import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {
  applyLeaveController,
  getAllLeavesController,
  getMyLeavesController,
} from "./leave.controller.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, applyLeaveController)
  .get(verifyJWT, getAllLeavesController);
router.route("/my-leaves").get(verifyJWT, getMyLeavesController);

export default router;
