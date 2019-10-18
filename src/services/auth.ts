import crypto from "crypto";
import * as jwt from "jsonwebtoken";

import { config } from "../config";
import { Token } from "../schemas/auth";
import { mongodb } from "./mongodb";
import { accountKey, ApolloInvalidClientKeyError, ApolloInvalidPasswordError, ApolloMultipleSessionError, ApolloSessionExpiredError, ApolloUnknownKeyIDError, ApolloUserNotFoundError, logger } from "./service";

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
    // FIXME delay
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      ]).toString("base64");
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloUserNotFoundError({
      xlogin,
      login
    });
  }

  public async login(xlogin: string, xhpassword: string, expiry: number, info: any = {}): Promise<Token> {
    // FIXME delay
    await new Promise(resolve => setTimeout(resolve, 1000));
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
        if (config.auth.singleSession && user.audits) {
          const sessions = {};
          if (config.auth.sessionExpiry) {
            const now = Date.now();
            for (let i = user.audits.length - 1; i >= 0; i--) {
              const audit = user.audits[i];
              if (audit.action === "login" && (new Date(audit.time).getTime() + config.auth.sessionExpiry * 1000) > now) {
                sessions[audit.clientKey] = audit;
              } else if (audit.action === "logout" || audit.action === "logoutForced") {
                delete sessions[audit.clientKey];
              }
            }
          } else {
            for (let i = user.audits.length - 1; i >= 0; i--) {
              const audit = user.audits[i];
              if (audit.action === "login") {
                sessions[audit.clientKey] = audit;
              } else if (audit.action === "logout" || audit.action === "logoutForced") {
                delete sessions[audit.clientKey];
              }
            }
          }
          if (Object.keys(sessions).length > 0) {
            throw new ApolloMultipleSessionError({
              xlogin,
              login,
              xhpassword,
              hpasswordInput,
              debug: {
                login,
                user,
                sessions
              }
            });
          }
        }
        await mongodb.models.user.updateOne({ login }, {
          $push: {
            audits: {
              $each: [
                {
                  ...info,
                  action: "login",
                  clientKey: this.clientKey,
                  time: new Date()
                }
              ],
              $position: 0,
              $slice: 100
            }
          }
        });
        return await this.generateToken(user, xlogin, expiry);
      }
      logger.info({ xlogin, login, user, hpasswordInput }, "invalid login");
      throw new ApolloInvalidPasswordError({
        xlogin,
        xhpassword,
        debug: {
          hpasswordInput,
          login, user
        }
      });
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloUserNotFoundError({
      xlogin
    });
  }

  public async refresh(token: string): Promise<Token> {
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64").toString("utf8")
    );
    const keyid = header.kid;
    if (!(config.keys[keyid] && config.keys[keyid].key)) {
      throw new ApolloUnknownKeyIDError({
        header,
        token,
      });
    }
    const refreshObj = jwt.decode(token, config.keys[keyid].key);
    const expired = (refreshObj.iat + config.auth.sessionExpiry) * 1000;
    if (expired < Date.now()) {
      logger.info({ token, expired, now: Date.now() }, "jwt refresh");
      throw new ApolloSessionExpiredError({
        expired: new Date(expired)
      });
    }
    const xlogin = refreshObj.xl;
    const aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    const user = await mongodb.models.user.findOne({ login });
    logger.info({ login, user }, "get user");
    if (user) {
      if (config.auth.singleSession) {
        let session = null;
        if (user.audits) {
          if (config.auth.sessionExpiry) {
            const now = Date.now();
            for (let i = user.audits.length - 1; i >= 0; i--) {
              const audit = user.audits[i];
              if (audit.action === "login" && (new Date(audit.time).getTime() + config.auth.sessionExpiry * 1000) > now) {
                session = audit;
              } else if (audit.action === "logout" || audit.action === "logoutForced") {
                session = null;
              }
            }
          } else {
            for (let i = user.audits.length - 1; i >= 0; i--) {
              const audit = user.audits[i];
              if (audit.action === "login") {
                session = audit;
              } else if (audit.action === "logout" || audit.action === "logoutForced") {
                session = null;
              }
            }
          }
        }
        if (session) {
          if (session.clientKey !== refreshObj.ck) {
            throw new ApolloInvalidClientKeyError();
          }
        } else {
          throw new ApolloInvalidClientKeyError();
        }
      } else {
        const sessions = {};
        if (user.audits) {
          if (config.auth.sessionExpiry) {
            const now = Date.now();
            for (let i = user.audits.length - 1; i >= 0; i--) {
              const audit = user.audits[i];
              if (audit.action === "login" && (new Date(audit.time).getTime() + config.auth.sessionExpiry * 1000) > now) {
                sessions[audit.clientKey] = audit;
              } else if (audit.action === "logout" || audit.action === "logoutForced") {
                delete sessions[audit.clientKey];
              }
            }
          } else {
            for (let i = user.audits.length - 1; i >= 0; i--) {
              const audit = user.audits[i];
              if (audit.action === "login") {
                sessions[audit.clientKey] = audit;
              } else if (audit.action === "logout" || audit.action === "logoutForced") {
                delete sessions[audit.clientKey];
              }
            }
          }
        }
        if (!sessions[refreshObj.ck]) {
          throw new ApolloInvalidClientKeyError();
        }
      }
      return await this.generateToken(user, xlogin);
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloUserNotFoundError({
      xlogin
    });
  }

  public async logout(xlogin: string, info: any = {}): Promise<boolean> {
    const aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    const user = await mongodb.models.user.findOne({ login });
    logger.info({ login, user }, "get user");
    if (user) {
      const res = await mongodb.models.user.updateOne({ login }, {
        $push: {
          audits: {
            $each: [
              {
                ...info,
                action: "logout",
                clientKey: this.clientKey,
                time: new Date()
              }
            ],
            $position: 0,
            $slice: 100
          }
        }
      });
      logger.info({ res }, "logout");
      return res.modifiedCount === 1;
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloUserNotFoundError({
      xlogin,
      debug: {
        login
      }
    });
  }

  public async generateToken(user, xlogin, expiry = null): Promise<Token> {
    // FIXME validate max expiry
    const privileges = (await mongodb.models.role.find({ code: { $in: user.roles } })
      .toArray()).reduce((acc, role) => {
        acc.push(...role.privileges);
        return acc;
      }, []);
    logger.info({ privileges, roles: user.roles }, "get privileges");
    const token = jwt.sign({
      ck: this.clientKey,
      xl: xlogin,
      n: user.name,
      p: privileges
    }, config.keys.auth.pkey, {
      algorithm: "ES256",
      keyid: "auth",
      expiresIn: expiry || config.auth.tokenExpiry
    });
    return {
      seq: Date.now(),
      token
    };
  }
}
