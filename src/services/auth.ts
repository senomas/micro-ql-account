import { ApolloError } from 'apollo-server-errors';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

import { config, keyEncoder } from '../config';
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
    logger.info({ login, user }, "get usere");
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
        logger.info({ auth: config.keys.auth }, "keys");
        const pem = keyEncoder.encodePrivate(
          config.keys.auth.pkey,
          "raw",
          "pem"
        );
        const token = jwt.sign({
          login
        }, pem, {
          algorithm: "ES256",
          keyid: "auth",
          expiresIn: config.auth.tokenExpiry
        });
        return {
          seq: 1000,
          token,
          refresh: "REFRESH"
        }
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
      xlogin,
    });
  }
}
