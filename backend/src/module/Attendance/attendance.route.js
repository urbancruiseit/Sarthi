import { Router } from "express";
import {
  getAttendanceController,
  markAttendanceController,
  updatePunchOutController,
} from "./attendance.contrroler.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(markAttendanceController)
  .get(verifyJWT, getAttendanceController);
router.route("/update").put(updatePunchOutController);

export default router;
