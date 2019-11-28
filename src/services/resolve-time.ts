import { MiddlewareFn } from "type-graphql";

import { logger } from "./service";

export const ResolveTimeMiddleware: MiddlewareFn = async ({ info, args }, next) => {
  const start = new Date();
  const t0 = process.hrtime();
  await next();
  const t1 = process.hrtime(t0);
  const end = new Date();
  const ps = [];
  for (let p = info.path; p; p = p.prev) {
    ps.unshift(p.key);
  }
  logger.info({
    graphql: {
      path: ps.join("."),
      [`args_${info.parentType.name}_${info.fieldName}`]: args,
      type: info.parentType.name
    },
    event: {
      dataset: "graphql-resolver",
      duration: t1[0] * 1000000000 + t1[1],
      start,
      end,
      kind: "event",
      category: "process"
    },
  }, 'graphql-resolver');
};
