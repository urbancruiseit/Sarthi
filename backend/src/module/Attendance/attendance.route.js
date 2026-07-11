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
  .post(verifyJWT, markAttendanceController)
  .get(verifyJWT, getAttendanceController);
router.route("/update").put(verifyJWT, updatePunchOutController);

export default router;
