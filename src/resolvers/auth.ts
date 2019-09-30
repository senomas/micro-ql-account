import { Arg, FieldResolver, Info, Query, Resolver, Root } from 'type-graphql';

import { Auth, Token, User } from '../schemas/auth';
import { AuthService } from '../services/auth';
import { GraphQLResolveInfo } from 'graphql';
import { logger } from '../services/service';

@Resolver(of => Auth)
export default class {
  @Query(returns => Auth)
  auth(@Arg("clientKey") clientKey: string): AuthService {
    return new AuthService(clientKey);
  }

  @FieldResolver(of => String)
  async salt(@Root() ctx: AuthService, @Arg("xlogin") xlogin: string, @Info() info: GraphQLResolveInfo): Promise<string> {
    logger.info({ info }, "salt info");
    return await ctx.salt(xlogin);
  }

  @FieldResolver(of => Token)
  async login(@Root() ctx: AuthService, @Arg("xlogin") xlogin: string, @Arg("xhpassword") xhpassword: string, @Info() info: GraphQLResolveInfo): Promise<Token> {
    logger.info({ info }, "login info");
    return await ctx.login(xlogin, xhpassword);
  }

  @FieldResolver()
  user(@Root() ctx: AuthService, @Info() info: GraphQLResolveInfo): User {
    return {
      id: "0001",
      login: "seno",
      name: "denmas"
    }
  }
}
