import { logger } from "./services/service";
import { AuthChecker, UnauthorizedError, ForbiddenError } from "type-graphql";

export const customAuthChecker: AuthChecker<any> = (
  { root, args, context, info },
  roles,
) => {
  const user = context.user;
  const error = roles.indexOf("@null") < 0;
  if (!user) {
    logger.info({ user, roles }, "customAuthChecker not login");
    if (error) {
      throw new UnauthorizedError();
    }
    return false;
  }
  if (roles.filter(v => !v.startsWith("@")).length === 0) {
    logger.info({ pass: true, user, roles }, "customAuthChecker");
    return true;
  }
  let pass = false;
  for (let role of roles) {
    if (role.startsWith("!")) {
      role = role.substring(0, -1);
      if (user.p.indexOf(role) < 0) {
        logger.info({ pass: false, role, user, roles }, "customAuthChecker mandatory");
        if (error) {
          throw new ForbiddenError();
        }
        return false;
      }
      pass = true;
    } else if (user.p.indexOf(role) >= 0) {
      pass = true;
    }
  }
  logger.info({ pass, user, roles }, "customAuthChecker");
  if (error && !pass) {
    throw new ForbiddenError();
  }
  return pass;
};
