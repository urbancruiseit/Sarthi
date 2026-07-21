import { Router } from "express";
import {
  getAttendanceController,
  getMonthlyAttendanceController,
  markAttendanceController,
  updatePunchOutController,
  updateStatusController,
} from "./attendance.contrroler.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, markAttendanceController)
  .get(verifyJWT, getAttendanceController);
router.route("/monthly").get(getMonthlyAttendanceController);
router.route("/update").put(updatePunchOutController);
router.route("/status").patch(updateStatusController);

export default router;
