import {
  Arg,
  FieldResolver,
  Query,
  Resolver,
  Root,
  Ctx
} from "type-graphql";
import * as os from "os";
import * as fs from "fs";
import { Auth, Token, UserToken, ServerInfo } from "../schemas/auth";
import { AuthService } from "../services/auth";
import { logger } from "../services/service";

@Resolver(of => Auth)
export class AuthResolver {
  @Query(returns => Auth)
  auth(@Arg("clientKey") clientKey: string): AuthService {
    return new AuthService(clientKey);
  }

  @Query(returns => Boolean)
  async logout(@Ctx() ctx): Promise<Boolean> {
    logger.info({ ctx }, "logout")
    const svc = new AuthService(ctx.user.ck);
    return await svc.logout(ctx.user.xl, {
      clientIP: ctx.remoteAddress,
      userAgent: ctx.headers["user-agent"]
    });
  }

  @Query(returns => ServerInfo)
  accountInfo(): ServerInfo {
    const data = JSON.parse(fs.readFileSync("./dist/build.json").toString());
    logger.info({ data }, "build.json");
    return {
      host: os.hostname(),
      time: new Date(),
      buildTime: new Date(data.buildTime),
      commits: data.commits
        ? data.commits.map(v => ({
          ...v,
          authorDate: new Date(v.authorDate)
        }))
        : null
    };
  }

  @Query(returns => UserToken, { nullable: true })
  async me(@Ctx() ctx, @Arg("ts", { nullable: true }) ts: string): Promise<UserToken> {
    logger.info({ ctx, ts }, "me")
    if (ctx.user) {
      return {
        time: new Date(),
        clientKey: ctx.user.ck,
        xlogin: ctx.user.xl,
        name: ctx.user.n,
        privileges: ctx.user.p,
        token: ctx.user.token
      };
    }
    return {
      time: new Date(),
      clientKey: null,
      xlogin: null,
      name: null,
      privileges: [],
      token: null
    };
  }

  @FieldResolver(of => String)
  async salt(
    @Root() svc: AuthService,
    @Arg("xlogin") xlogin: string
  ): Promise<string> {
    return await svc.salt(xlogin);
  }

  @FieldResolver(of => Token)
  async login(
    @Ctx() ctx,
    @Root() svc: AuthService,
    @Arg("xlogin") xlogin: string,
    @Arg("xhpassword") xhpassword: string
  ): Promise<Token> {
    logger.info({ ctx }, "login")
    return await svc.login(xlogin, xhpassword, {
      clientIP: ctx.remoteAddress,
      userAgent: ctx.headers["user-agent"]
    });
  }
}
