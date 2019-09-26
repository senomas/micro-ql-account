import { IResolvers } from 'graphql-tools';
// import { GQLAccount, GQLKeychange } from "./schema.d"

const resolverMap: IResolvers = {
  Query: {
    privileges(_: void, args: void): string[] {
      return [`👋 Hello world! 👋`];
    },
    keychange(_: void, { key, token }): any {
      return {
        key
      };
    },
    accounts(_: void, { first }): any[] {
      return [{
        id: "1231231231",
        name: "admin"
      }];
    }
  },
};

export default resolverMap;
