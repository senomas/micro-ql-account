import { Query, Resolver, Authorized, Args } from 'type-graphql';

import { User, FindUserArgs, PartialUser } from '../schemas/user';
import { mongodb } from '../services/mongodb';
import { logger } from '../services/service';

@Resolver(of => User)
export class UserResolver {
  @Query(returns => PartialUser)
  @Authorized(["user.read"])
  async users(@Args() args: FindUserArgs): Promise<PartialUser> {
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
    logger.info({ args, query }, "user query");
    const total = await mongodb.models.user.count(query);
    const cursor = mongodb.models.user.find(query);
    if (args.skip) {
      cursor.skip(args.skip);
    }
    if (args.limit) {
      cursor.limit(args.limit);
    } else {
      cursor.limit(100);
    }
    const items = (await cursor.toArray()).map(user => {
      user.id = user._id;
      return user;
    });
    logger.info({ items }, "resolver users");
    return {
      total,
      items
    };
  }
}
