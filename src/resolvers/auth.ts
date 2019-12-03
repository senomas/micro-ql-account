import * as fs from 'fs';
import * as os from 'os';
import {
  Arg, Ctx, FieldResolver, Int, Mutation, Query, Resolver, Root, UseMiddleware
} from 'type-graphql';

import { config } from '../config';
import { Auth, AuthConfig, Token, UserToken, Salt, LoginResponse } from '../schemas/auth';
import { AuthService } from '../services/auth';
import { logger } from '../services/service';
import { LoggerResolverMiddleware } from '../services/logger';

@Resolver(of => Auth)
export class AuthResolver {
  @Query(returns => Auth)
  @UseMiddleware(LoggerResolverMiddleware)
  public auth(@Ctx() ctx, @Arg("clientKey") clientKey: string): AuthService {
    return new AuthService(ctx, clientKey);
  }

  @Query(returns => AuthConfig)
  public authConfig(): AuthConfig {
    return config.auth;
  }

  @Query(returns => UserToken, { nullable: true })
  @UseMiddleware(LoggerResolverMiddleware)
  public async me(@Ctx() ctx, @Arg("ts", { nullable: true }) ts: string): Promise<UserToken> {
    logger.info({ ctx }, "me");
    const res: any = { time: new Date(), privileges: [] };
    if (ctx.user) {
      res.clientKey = ctx.user.ck;
      res.xlogin = ctx.user.xl;
      res.name = ctx.user.n;
      res.privileges = ctx.user.p;
      res.issuedAt = new Date(ctx.user.iat * 1000);
      res.expiredAt = new Date(ctx.user.exp * 1000);
      const utoken = ctx.user.token;
      if (utoken) {
        res.token = {
          seq: utoken.seq,
          value: utoken.token
        };
      }
    }
    if (ctx.errors.length > 0) {
      if (!res.token) {
        res.token = {};
      }
      res.token.errors = ctx.errors;
    }
    return res;
  }

  @FieldResolver(of => Salt)
  @UseMiddleware(LoggerResolverMiddleware)
  public async salt(
    @Root() svc: AuthService,
    @Arg("xlogin") xlogin: string
  ): Promise<Salt> {
    try {
      return {
        value: await svc.salt(xlogin)
      };
    } catch (err) {
      return {
        error: {
          path: err.path,
          name: err.name,
          value: err.value
        }
      };
    }
  }

  @FieldResolver(of => LoginResponse)
  @UseMiddleware(LoggerResolverMiddleware)
  public async login(
    @Ctx() ctx,
    @Root() svc: AuthService,
    @Arg("xlogin") xlogin: string,
    @Arg("xhpassword") xhpassword: string,
    @Arg("expiry", of => Int, { nullable: true }) expiry: number
  ): Promise<LoginResponse> {
    logger.info({ ctx }, "login");
    return await svc.login(xlogin, xhpassword, expiry, {
      clientIP: ctx.remoteAddress,
      userAgent: ctx.headers["user-agent"]
    });
  }

  @Mutation(returns => Boolean)
  @UseMiddleware(LoggerResolverMiddleware)
  public async logout(@Ctx() ctx): Promise<boolean> {
    const svc = new AuthService(ctx, ctx.user.ck);
    return await svc.logout(ctx.user.xl, {
      clientIP: ctx.remoteAddress,
      userAgent: ctx.headers["user-agent"]
    });
  }
}
