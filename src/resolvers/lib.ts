import { Query, Resolver, Authorized, Args, Mutation, Arg } from 'type-graphql';

import { mongodb } from '../services/mongodb';
import { logger } from '../services/service';
import { UpdateResponse, DeleteResponse } from '../schemas/lib';

export interface CreateBaseResolverOption {
  suffix: string,
  suffixPlurals?: string,
  suffixCapitalize?: string,
  suffixCapitalizePlurals?: string,
  typeCls,
  partialTypeCls,
  addInput,
  updateInput,
  filterInput,
}

export function createBaseResolver(opt: CreateBaseResolverOption) {
  if (!opt.suffixPlurals) {
    opt.suffixPlurals = `${opt.suffix}s`;
  }
  if (!opt.suffixCapitalize) {
    opt.suffixCapitalize = `${opt.suffix.slice(0, 1).toUpperCase()}${opt.suffix.slice(1)}`;
  }
  if (!opt.suffixCapitalizePlurals) {
    opt.suffixCapitalizePlurals = `${opt.suffix.slice(0, 1).toUpperCase()}${opt.suffix.slice(1)}s`;
  }

  @Resolver({ isAbstract: true })
  abstract class BaseResolver {
    protected queryFilters: any = {
      skip: () => { },
      limit: () => { }
    };

    protected query(filter) {
      const query: any = {};
      if (filter) {
        for (const [k, v] of Object.entries(filter)) {
          if (this.queryFilters[k]) {
            this.queryFilters[k](query, v, k);
          } else {
            query[k] = v;
          }
        }
      }
      return query;
    }

    @Query(returns => opt.partialTypeCls, { name: `${opt.suffixPlurals}` })
    @Authorized([`${opt.suffix}.read`])
    async find(
      @Arg("skip", { nullable: true }) skip: number,
      @Arg("limit", { nullable: true }) limit: number,
      @Arg("filter", of => opt.filterInput, { nullable: true }) filter
    ) {
      const query = this.query(filter);
      logger.info({ filter, query }, `${opt.suffix} query`);
      const total = await mongodb.models[opt.suffix].count(query);
      const cursor = mongodb.models[opt.suffix].find(query);
      if (skip) {
        cursor.skip(skip);
      }
      if (limit) {
        cursor.limit(limit);
      } else {
        cursor.limit(100);
      }
      const items = (await cursor.toArray()).map(item => {
        item.id = item._id;
        return item;
      });
      logger.info({ items }, opt.suffixPlurals);
      return {
        total,
        items
      };
    }

    @Mutation(returns => opt.typeCls, { name: `add${opt.suffixCapitalize}` })
    @Authorized([`${opt.suffix}.create`])
    async add(@Arg("data", of => opt.addInput) data) {
      const res = await mongodb.models[opt.suffix].insertOne(data);
      logger.info({ res }, `insert ${opt.suffix}`);
      return {
        id: res.insertedId,
        ...data
      };
    }

    @Mutation(returns => UpdateResponse, { name: `update${opt.suffixCapitalizePlurals}` })
    @Authorized([`${opt.suffix}.update`])
    async updates(@Arg("filter", of => opt.filterInput) filter, @Arg("data", of => opt.updateInput) data): Promise<UpdateResponse> {
      const query = this.query(filter);
      const updates = {
        $set: data
      };
      logger.info({ filter, data, query, updates }, `update ${opt.suffix} query`);
      const res = await mongodb.models[opt.suffix].updateMany(query, updates);
      logger.info({ res }, `update ${opt.suffix}`);
      return {
        matched: res.matchedCount,
        modified: res.modifiedCount
      };
    }

    @Mutation(returns => DeleteResponse, { name: `delete${opt.suffixCapitalizePlurals}` })
    @Authorized([`${opt.suffix}.delete`])
    async deletes(@Arg("filter", of => opt.filterInput) filter): Promise<DeleteResponse> {
      const query = this.query(filter);
      logger.info({ filter, query }, `delete ${opt.suffix} query`);
      const res = await mongodb.models[opt.suffix].deleteMany(query);
      logger.info({ res }, `delete ${opt.suffix}`);
      return {
        deleted: res.deletedCount
      }
    }
  }

  return BaseResolver;
}
