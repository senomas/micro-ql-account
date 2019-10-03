import { logger } from "./services/service";
import { AuthChecker } from "type-graphql";

export const customAuthChecker: AuthChecker<any> = (
  { root, args, context, info },
  roles,
) => {
  const user = context.user;
  if (!user) {
    logger.info({ user, roles }, "customAuthChecker not login");
    return false;
  }
  if (roles.length === 0) {
    logger.info({ pass: true, user, roles }, "customAuthChecker");
    return true;
  }
  let pass = false;
  for (let role of roles) {
    if (role.startsWith("!")) {
      role = role.substring(0, -1);
      if (user.p.indexOf(role) < 0) {
        logger.info({ pass: false, role, user, roles }, "customAuthChecker mandatory");
        return false;
      }
      pass = true;
    } else if (user.p.indexOf(role) >= 0) {
      pass = true;
    }
  }
  logger.info({ pass, user, roles }, "customAuthChecker");
  return pass;
};
