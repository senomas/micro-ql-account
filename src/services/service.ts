import * as bunyan from "bunyan";
import * as crypto from "crypto";
import * as fs from "fs";
import * as yaml from "js-yaml";

export const config = yaml.safeLoad(fs.readFileSync("config.yaml").toString());

export const accountKey = crypto.createECDH(config.auth.curves);
accountKey.setPrivateKey(config.keys.account.pkey, "base64");

export const logger = bunyan.createLogger({ name: "app" });
