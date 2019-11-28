import { AuthChecker, ForbiddenError, UnauthorizedError } from "type-graphql";

import { logger } from "./services/service";

export const customAuthChecker: AuthChecker<any> = (
  { context, info },
  roles,
) => {
  const ps = [];
  for (let p = info.path; p; p = p.prev) {
    ps.unshift(p.key);
  }
  const path = ps.join(".");
  const user = context.user;
  const error = roles.indexOf("@null") < 0;
  if (!user) {
    logger.info({ path, authPass: false, user, err: error }, "customAuthChecker");
    if (error) {
      throw new UnauthorizedError();
    }
    return false;
  }
  if (roles.filter(v => !v.startsWith("@")).length === 0) {
    logger.info({ path, authPass: true, user, roles, err: error }, "customAuthChecker");
    return true;
  }
  let pass = false;
  for (let role of roles) {
    if (role.startsWith("!")) {
      role = role.substring(0, -1);
      if (user.p.indexOf(role) < 0) {
        if (error) {
          return false;
        }
        return false;
      }
      pass = true;
    } else if (user.p.indexOf(role) >= 0) {
      pass = true;
    }
  }
  logger.info({ path, authPass: pass, user, roles, err: error }, "customAuthChecker");
  if (error && !pass) {
    throw new ForbiddenError();
  }
  return pass;
};
