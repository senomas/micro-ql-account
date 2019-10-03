import { Query, Resolver, Authorized, Args, Mutation, Arg, Int, ClassType } from 'type-graphql';

import { Role, FindRoleArgs, PartialRole, NewRoleInput, UpdateRoleInput, UpdateRoleArgs, FilterRoleInput } from '../schemas/role';
import { mongodb } from '../services/mongodb';
import { logger } from '../services/service';
import { UpdateResponse, DeleteResponse } from '../schemas/lib';

function createBaseResolver<T extends ClassType>(suffix: string, objectTypeCls: T, partialTypeCls) {
  @Resolver({ isAbstract: true })
  abstract class BaseResolver {

    protected query(args) {
      const query: any = {};
      for (const [k, v] of Object.entries(args)) {
        if (k === "limit" || k === "skip") {
          // skip
        } else if (k === "id") {
          query._id = v;
        } else if (k === "nameRegex") {
          query.name = { $regex: args.nameRegex };
        } else {
          query[k] = v;
        }
      }
      return query;
    }

    @Query(returns => partialTypeCls, { name: `${suffix}Find` })
    @Authorized([`${suffix}.read`])
    async find(@Args() args: FindRoleArgs): Promise<PartialRole> {
      const query = this.query(args);
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
      logger.info({ items }, "roles");
      return {
        total,
        items
      };
    }

    @Query(returns => objectTypeCls, { name: `${suffix}Add` })
    @Authorized([`${suffix}.create`])
    async add(@Arg("data") data: NewRoleInput): Promise<any> {
      const res = await mongodb.models.role.insertOne(data);
      logger.info({ res }, "insert role");
      return {
        id: res.insertedId,
        ...data
      };
    }

    @Mutation(returns => UpdateResponse, { name: `${suffix}Update` })
    @Authorized([`${suffix}.update`])
    async update(@Args() args: UpdateRoleArgs): Promise<UpdateResponse> {
      const query = this.query(args.filter);
      const updates = {
        $set: args.data
      };
      logger.info({ args, query, updates }, "update role query");
      const res = await mongodb.models.role.updateMany(query, updates);
      logger.info({ res }, "update role");
      return {
        matched: res.matchedCount,
        modified: res.modifiedCount
      };
    }

    @Mutation(returns => DeleteResponse, { name: `${suffix}Delete` })
    @Authorized([`${suffix}.delete`])
    async delete(@Arg("filter") filter: FilterRoleInput): Promise<DeleteResponse> {
      const query = this.query(filter);
      logger.info({ filter, query }, "delete role query");
      const res = await mongodb.models.role.deleteMany(query);
      logger.info({ res }, "delete role");
      return {
        deleted: res.deletedCount
      }
    }
  }

  return BaseResolver;
}
