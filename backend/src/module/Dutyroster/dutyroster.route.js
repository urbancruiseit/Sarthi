import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {
  createDutyRosterController,
  getDutyRosterListController,
} from "./dutyroster.controller.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, getDutyRosterListController)
  .get(verifyJWT, createDutyRosterController);
// router.route("/monthly").get(getMonthlyAttendanceController);
// router.route("/update").put(verifyJWT, updatePunchOutController);
// router.route("/status").patch(updateStatusController);

export default router;
