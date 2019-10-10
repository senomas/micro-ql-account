import { Arg, FieldResolver, Query, Resolver, Root, Ctx, Authorized } from 'type-graphql';
import * as os from "os";
import * as fs from "fs";
import { Auth, Token, UserToken, ServerInfo } from '../schemas/auth';
import { AuthService } from '../services/auth';
import { logger } from '../services/service';

@Resolver(of => Auth)
export class AuthResolver {
  @Query(returns => Auth)
  auth(@Arg("clientKey") clientKey: string): AuthService {
    return new AuthService(clientKey);
  }

  @Query(returns => ServerInfo)
  accountInfo(): ServerInfo {
    const data = JSON.parse(fs.readFileSync("./dist/build.json").toString());
    logger.info({ data }, "build.json");
    return {
      host: os.hostname(),
      time: new Date(),
      buildTime: new Date(data.buildTime),
      commits: data.commits ? data.commits.map(v => ({
        ...v,
        authorDate: new Date(v.authorDate)
      })) : null
    }
  }

  @Query(returns => UserToken, { nullable: true })
  @Authorized([])
  async me(@Ctx() ctx): Promise<UserToken> {
    logger.info({ ctx }, "auth service ctx");
    if (ctx.user) {
      return {
        clientKey: ctx.user.ck,
        xlogin: ctx.user.xl,
        name: ctx.user.n,
        privileges: ctx.user.p
      };
    }
    return undefined;
  }

  @FieldResolver(of => String)
  async salt(@Root() ctx: AuthService, @Arg("xlogin") xlogin: string): Promise<string> {
    return await ctx.salt(xlogin);
  }

  @FieldResolver(of => Token)
  async login(@Root() ctx: AuthService, @Arg("xlogin") xlogin: string, @Arg("xhpassword") xhpassword: string): Promise<Token> {
    return await ctx.login(xlogin, xhpassword);
  }

  @FieldResolver(of => Token)
  async refresh(@Root() ctx: AuthService, @Arg("refresh") refresh: string): Promise<Token> {
    return await ctx.refresh(refresh);
  }
}
