import { ApolloError } from 'apollo-server-errors';
import * as crypto from 'crypto';

import { User, Token } from '../schemas/auth';
import { accountKey, config, logger } from './service';

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

  public salt(xlogin: string): string {
    const salt = "plain-salt";
    const aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    if (login === "seno") {
      const aes = crypto.createCipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
      return Buffer.concat([
        aes.update(Buffer.from(salt, "utf8")),
        aes.final()
      ]).toString("base64")
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloError("invalid login", "InvalidLogin", {
      xlogin,
      login
    });
  }

  public login(xlogin: string, xhpassword: string): Token {
    let aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    if (login === "seno") {
      const salt = "plain-salt";
      const password = "dodol123";
      const hpassword = crypto.pbkdf2Sync(
        password,
        salt,
        config.auth.pbkdf2.iterations,
        config.auth.pbkdf2.hashBytes,
        "sha512"
      ).toString("base64");
      aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
      const hpasswordInput = Buffer.concat([
        aesd.update(Buffer.from(xhpassword, "base64")),
        aesd.final()
      ]).toString("base64");
      if (hpassword === hpasswordInput) {
        return {
          seq: 1000,
          token: "TOKEN",
          refresh: "REFRESH"
        }
      }
      logger.info({ xlogin, login, hpassword, hpasswordInput }, "invalid login");
      throw new ApolloError("invalid login", "InvalidLogin", {
        xlogin,
      });
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloError("invalid login", "InvalidLogin", {
      xlogin,
    });
  }
}
