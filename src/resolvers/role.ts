import { Query, Resolver, Authorized, Args } from 'type-graphql';

import { Role, FindRoleArgs, PartialRole } from '../schemas/role';
import { mongodb } from '../services/mongodb';
import { logger } from '../services/service';

@Resolver(of => Role)
export class RoleResolver {
  @Query(returns => PartialRole)
  @Authorized(["role.read"])
  async roles(@Args() args: FindRoleArgs): Promise<PartialRole> {
    const query: any = {};
    for (const [k, v] of Object.entries(args)) {
      if (k === "limit" || k === "skip") {
        // skip
      } else if (k === "nameRegex") {
        query.name = { $regex: args.nameRegex };
      } else {
        query[k] = v;
      }
    }
    logger.info({ args, query }, "role query");
    const total = await mongodb.models.role.count(query);
    const cursor = mongodb.models.role.find(query);
    if (args.skip) {
      cursor.skip(args.skip);
    }
    if (args.limit) {
      cursor.limit(args.limit);
    } else {
      cursor.limit(100);
    }
    const items = (await cursor.toArray()).map(role => {
      role.id = role._id;
      return role;
    });
    logger.info({ items }, "resolver roles");
    return {
      total,
      items
    };
  }
}
