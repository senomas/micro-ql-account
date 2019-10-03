import * as bunyan from "bunyan";
import * as crypto from "crypto";
import { config, keyEncoder } from "../config";

export const logger = bunyan.createLogger({ name: "app" });
const raw = Buffer.from(keyEncoder.encodePrivate(config.keys.account.pkey, "pem", "raw"), "hex").toString("base64");
logger.info({ raw, pem: config.keys.account.pkey }, "keys");

export const accountKey = crypto.createECDH(config.auth.curves);
accountKey.setPrivateKey(raw, "base64");
