import { MiddlewareInterface, NextFn, ResolverData, ArgumentValidationError } from "type-graphql";

import { logger } from "./service";

export class ErrorLoggerMiddleware implements MiddlewareInterface<any> {

  async use({ context, info }: ResolverData<any>, next: NextFn) {
    try {
      return await next();
    } catch (err) {
      const ps = [];
      for (let p = info.path; p; p = p.prev) {
        ps.unshift(p.key);
      }
      const path = ps.join(".");
      logger.error({
        err,
        path,
        user: context.user
      }, 'graphql-error');
      throw err;
    }
  }
}