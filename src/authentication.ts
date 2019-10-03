import * as jwt from "jsonwebtoken";
import { logger } from "./services/service";
import { config } from "./config";
import { AuthenticationError } from "apollo-server-core";

export function getUser(req) {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    let header;
    try {
      header = JSON.parse(
        Buffer.from(token.split(".")[0], "base64").toString("utf8")
      );
    } catch (err) {
      logger.error({ token, err }, "invalid token header");
      throw new AuthenticationError("InvalidTokenHeader");
    }
    logger.info({ token, header, url: req.url }, "jwt authentication");
    const keyid = header.kid;
    if (!(config.keys[keyid] && config.keys[keyid].key)) {
      throw new AuthenticationError("UnknownKeyID");
    }
    try {
      return jwt.verify(token, config.keys[keyid].key);
    } catch (err) {
      logger.error({ header, token, err }, "invalid token");
      throw new AuthenticationError("InvalidToken");
    }
  }
  return null;
};