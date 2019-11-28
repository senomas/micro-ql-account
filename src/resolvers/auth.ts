import * as fs from 'fs';
import * as os from 'os';
import {
    Arg, Ctx, FieldResolver, Int, Mutation, Query, Resolver, Root, UseMiddleware
} from 'type-graphql';

import { config } from '../config';
import { Auth, AuthConfig, ServerInfo, Token, UserToken } from '../schemas/auth';
import { AuthService } from '../services/auth';
import { ResolveTimeMiddleware } from '../services/resolve-time';
import { logger } from '../services/service';

@Resolver(of => Auth)
export class AuthResolver {
  @Query(returns => Auth)
  @UseMiddleware(ResolveTimeMiddleware)
  public auth(@Arg("clientKey") clientKey: string): AuthService {
    return new AuthService(clientKey);
  }

  @Query(returns => AuthConfig)
  public authConfig(): AuthConfig {
    return config.auth;
  }

  @Query(returns => ServerInfo)
  public accountInfo(): ServerInfo {
    const data = JSON.parse(fs.readFileSync("./dist/build.json").toString());
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
  @UseMiddleware(ResolveTimeMiddleware)
  public async me(@Ctx() ctx, @Arg("ts", { nullable: true }) ts: string): Promise<UserToken> {
    logger.info({ ctx }, "me");
    if (ctx.user) {
      return {
        time: new Date(),
        clientKey: ctx.user.ck,
        xlogin: ctx.user.xl,
        name: ctx.user.n,
        privileges: ctx.user.p,
        issuedAt: new Date(ctx.user.iat * 1000),
        expiredAt: new Date(ctx.user.exp * 1000),
        token: ctx.user.token
      };
    }
    return {
      time: new Date(),
      clientKey: null,
      xlogin: null,
      name: null,
      privileges: [],
      issuedAt: null,
      expiredAt: null,
      token: null
    };
  }

  @FieldResolver(of => String)
  @UseMiddleware(ResolveTimeMiddleware)
  public async salt(
    @Root() svc: AuthService,
    @Arg("xlogin") xlogin: string
  ): Promise<string> {
    return await svc.salt(xlogin);
  }

  @FieldResolver(of => Token)
  @UseMiddleware(ResolveTimeMiddleware)
  public async login(
    @Ctx() ctx,
    @Root() svc: AuthService,
    @Arg("xlogin") xlogin: string,
    @Arg("xhpassword") xhpassword: string,
    @Arg("expiry", of => Int, { nullable: true }) expiry: number
  ): Promise<Token> {
    logger.info({ ctx }, "login");
    return await svc.login(xlogin, xhpassword, expiry, {
      clientIP: ctx.remoteAddress,
      userAgent: ctx.headers["user-agent"]
    });
  }

  @Mutation(returns => Boolean)
  @UseMiddleware(ResolveTimeMiddleware)
  public async logout(@Ctx() ctx): Promise<boolean> {
    const svc = new AuthService(ctx.user.ck);
    return await svc.logout(ctx.user.xl, {
      clientIP: ctx.remoteAddress,
      userAgent: ctx.headers["user-agent"]
    });
  }
}
