import { ApolloError } from 'apollo-server-errors';
import crypto from 'crypto';
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

  public async login(xlogin: string, xhpassword: string, info: any = {}): Promise<Token> {
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
          let sessions = {};
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
            throw new ApolloError("MultipleSession", "MultipleSession", {
              xlogin,
              login,
              xhpassword,
              hpasswordInput,
              user,
              sessions
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
        return await this.generateToken(user, xlogin);
      }
      logger.info({ xlogin, login, user, hpasswordInput }, "invalid login");
      throw new ApolloError("InvalidLogin", "InvalidLogin", {
        xlogin,
        login,
        xhpassword,
        hpasswordInput,
        user
      });
    }
    logger.info({ xlogin, login }, "invalid login");
    throw new ApolloError("InvalidLogin", "InvalidLogin", {
      xlogin
    });
  }

  public async refresh(token: string): Promise<Token> {
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64").toString("utf8")
    );
    logger.info({ token, header }, "jwt refresh");
    const keyid = header.kid;
    if (!(config.keys[keyid] && config.keys[keyid].key)) {
      throw new ApolloError("unknown keyid", "UnknownKeyID", {
        header,
        token,
      });
    }
    const refreshObj = jwt.decode(token, config.keys[keyid].key);
    const expired = (refreshObj.iat + config.auth.sessionExpiry) * 1000;
    if (expired < Date.now()) {
      logger.info({ token, expired, now: Date.now() }, "jwt refresh");
      throw new ApolloError("SessionExpired", "SessionExpired", {
        expired: new Date(expired)
      });
    }
    logger.info({ token, header, refreshObj }, "jwt refresh");
    const xlogin = refreshObj.xl;
    let aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
    const login = Buffer.concat([
      aesd.update(Buffer.from(xlogin, "base64")),
      aesd.final()
    ]).toString("utf8");
    const user = await mongodb.models.user.findOne({ login });
    if (config.auth.singleSession) {
      let session = null;
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
      if (session) {
        if (session.clientKey !== refreshObj.ck) {
          throw new ApolloError("TokenNotFound", "TokenNotFound");
        }
      } else {
        throw new ApolloError("TokenNotFound", "TokenNotFound");
      }
    } else {
      let sessions = {};
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
      if (!sessions[refreshObj.ck]) {
        throw new ApolloError("TokenNotFound", "TokenNotFound");
      }
    }
    logger.info({ login, user }, "get user");
    if (user) {
      return await this.generateToken(user, xlogin);
    }
    throw new ApolloError("invalid refresh", "InvalidLogin", {
      token,
    });
  }

  public async logout(xlogin: string, info: any = {}): Promise<Boolean> {
    let aesd = crypto.createDecipheriv("aes-256-ctr", this.aesKey, this.aesSalt);
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
    throw new ApolloError("InvalidLogin", "InvalidLogin", {
      login,
      xlogin
    });
  }

  public async generateToken(user, xlogin = null): Promise<Token> {
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
      expiresIn: config.auth.tokenExpiry
    });
    return {
      seq: Date.now(),
      token
    }
  }
}
