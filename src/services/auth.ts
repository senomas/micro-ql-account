import { ApolloError } from 'apollo-server-errors';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

import { config } from '../config';
import { Token } from '../schemas/auth';
import { mongodb } from './mongodb';
import { accountKey, logger } from './service';

export class AuthService {
  public serverKey: string;
  private secretKey: Buffer;
  private aesKey: Buffer;
  private aesSalt: Buffer;

  constructor(public clientKey: string) {
    this.serverKey = accountKey.getPublicKey().toString("base64");
    this.secretKey = accountKey.computeSecret(
      Buffer.from(this.clientKey, "base64")
    );
    this.aesKey = crypto.pbkdf2Sync(
      this.secretKey,
      config.auth.salt,
      config.auth.aesKey.iterations,
      config.auth.aesKey.hashBytes,
      "sha512"
    );
    this.aesSalt = crypto.pbkdf2Sync(
      Buffer.from(this.clientKey, "base64"),
      config.auth.salt,
      config.auth.aesSalt.iterations,
      config.auth.aesSalt.hashBytes,
      "sha512"
    );
  }

  public async salt(xlogin: string): Promise<string> {
    const aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    const user = await mongodb.models.user.findOne({ login });
    logger.info({ login, user }, "get user");
    if (user) {
      const aes = crypto.createCipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
      return Buffer.concat([
        aes.update(Buffer.from(user.salt, "utf8")),
        aes.final()
      ]).toString("base64")
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloError("invalid login", "InvalidLogin", {
      xlogin,
      login
    });
  }

  public async login(xlogin: string, xhpassword: string): Promise<Token> {
    let aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    const user = await mongodb.models.user.findOne({ login });
    logger.info({ login, user }, "get user");
    if (user) {
      aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
      const hpasswordInput = Buffer.concat([
        aesd.update(Buffer.from(xhpassword, "base64")),
        aesd.final()
      ]).toString("base64");
      if (user.password === hpasswordInput) {
        return await this.generateToken(user, xlogin);
      }
      logger.info({ xlogin, login, user, hpasswordInput }, "invalid login");
      throw new ApolloError("invalid login", "InvalidLogin", {
        xlogin,
        login,
        xhpassword,
        hpasswordInput,
        user
      });
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloError("invalid login", "InvalidLogin", {
      xlogin
    });
  }

  public async refresh(refresh: string): Promise<Token> {
    const header = JSON.parse(
      Buffer.from(refresh.split(".")[0], "base64").toString("utf8")
    );
    logger.info({ refresh, header }, "jwt refresh");
    const keyid = header.kid;
    if (!(config.keys[keyid] && config.keys[keyid].key)) {
      throw new ApolloError("unknown keyid", "UnknownKeyID", {
        header,
        refresh,
      });
    }
    const refreshObj = jwt.verify(refresh, config.keys[keyid].key);
    logger.info({ refresh, header, refreshObj }, "jwt refresh");
    const xlogin = refreshObj.xl;
    let aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    const user = await mongodb.models.user.findOne({ login });
    logger.info({ login, user }, "get user");
    if (user) {
      return await this.generateToken(user, xlogin);
    }
    throw new ApolloError("invalid refresh", "InvalidLogin", {
      refresh,
    });
  }

  public async me(): Promise<any> {
    return undefined;
  }

  public async generateToken(user, xlogin = null): Promise<Token> {
    const privileges = (await mongodb.models.role.find({ code: { $in: user.roles } })
      .toArray()).reduce((acc, role) => {
        acc.push(...role.privileges);
        return acc;
      }, []);
    logger.info({ privileges, roles: user.roles }, "get privileges");
    const refresh = jwt.sign({
      ck: this.clientKey,
      xl: xlogin,
    }, config.keys.auth.pkey, {
      algorithm: "ES256",
      keyid: "auth",
      expiresIn: config.auth.tokenRefreshExpiry
    });
    const token = jwt.sign({
      ck: this.clientKey,
      xl: xlogin,
      n: user.name,
      p: privileges
    }, config.keys.auth.pkey, {
      algorithm: "ES256",
      keyid: "auth",
      expiresIn: config.auth.tokenExpiry
    });
    return {
      seq: Date.now(),
      token,
      refresh
    }
  }
}
