import * as bunyan from "bunyan";
import * as crypto from "crypto";
import { config } from "../config";

export const accountKey = crypto.createECDH(config.auth.curves);
accountKey.setPrivateKey(config.keys.account.pkey, "base64");

export const logger = bunyan.createLogger({ name: "app" });
