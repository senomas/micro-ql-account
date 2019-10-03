import { config } from '../config';
import { MongoModel, mongodb } from './mongodb';

import crypto = require("crypto");

export async function initUser() {
  mongodb.models.user = new MongoModel(mongodb, "user");
  mongodb.models.user.loadKey = (data) => ({ login: data.login });
  mongodb.models.user.loadEnhance = async (data) => {
    data.salt = crypto.randomBytes(config.auth.pbkdf2.hashBytes).toString("base64");
    data.password = crypto.pbkdf2Sync(
      data.password,
      Buffer.from(data.salt, "base64"),
      config.auth.pbkdf2.iterations,
      config.auth.pbkdf2.hashBytes,
      "sha512"
    ).toString("base64");
    return data;
  }
}