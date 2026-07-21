import { Router } from "express";

import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, markAttendanceController)
  .get(verifyJWT, getAttendanceController);
// router.route("/monthly").get(getMonthlyAttendanceController);
// router.route("/update").put(verifyJWT, updatePunchOutController);
// router.route("/status").patch(updateStatusController);

export default router;
