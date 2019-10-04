import { config } from '../config';
import { mongodb } from './mongodb';

import crypto = require("crypto");

export async function initUser() {
  const user = await mongodb.create("user");
  user.loadKey = (data) => ({ login: data.login });
  user.loadEnhance = async (data) => {
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
