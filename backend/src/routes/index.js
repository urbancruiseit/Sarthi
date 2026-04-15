import userRouter from "../module/user/user.route.js";

import vehicaleCodeRouter from "../module/vehiclemaster/vehiclemaster.route.js";
import regionRouter from "../module/Access/resion/region.route.js";
import zoneRouter from "../module/Access/zone/zone.route.js";
import departmentRouter from "../module/department/department.route.js";
import roleRouter from "../module/role/role.route.js";
import cityRouter from "../module/Access/city/city.route.js";
import assignCityRouter from "../module/employeeCity/employeecity.route.js";
import authRouter from "../module/CheckToken/checkToken.route.js";
import travelcityRouter from "../module/travelCitys/travelCity.route.js";
import linkRouter from "../module/onboardingLink/onboardingLInk.route.js";
import branchRouter from "../module/branch/branch.route.js";
import policyRouter from "../module/Policy/policy.route.js";
import stateRouter from "../module/state/state.route.js";
import noticeRouter from "../module/Notice/notice.route.js";
import countryRouter from "../module/Access/country/country.route.js";
import accessControlRouter from "../module/Accesscontrol/Accesscontrol.route.js";

const registerRoutes = (app) => {
  app.use("/api/v1/link", linkRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/vehicle", vehicaleCodeRouter);
  app.use("/api/v1/region", regionRouter);
  app.use("/api/v1/zone", zoneRouter);
  app.use("/api/v1/department", departmentRouter);
  app.use("/api/v1/role", roleRouter);
  app.use("/api/v1/city", cityRouter);
  app.use("/api/v1/assigncity", assignCityRouter);
  app.use("/api/v1/travelcity", travelcityRouter);
  app.use("/api/v1/branches", branchRouter);
  app.use("/api/v1/policies", policyRouter);
  app.use("/api/v1/states", stateRouter);
  app.use("/api/v1/notices", noticeRouter);
  app.use("/api/v1/country", countryRouter);
  app.use("/api/v1/access-control", accessControlRouter);
};

export default registerRoutes;
