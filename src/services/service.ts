import * as bunyan from 'bunyan';
import crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';

import { config, keyEncoder } from '../config';

export const appName = "account";
if (config.logger && config.logger.path && !fs.existsSync(config.logger.path)) {
  fs.mkdirSync(config.logger.path);
}
export const logger = bunyan.createLogger(
  (config.logger && config.logger.path) ? {
    name: appName,
    streams: [{
      type: "rotating-file",
      ...config.logger,
      path: `${process.env.LOGGER_PATH || config.logger.path || "."}/${appName}-${os.hostname()}.log`,
    }]
  } : { name: appName });
const raw = Buffer.from(keyEncoder.encodePrivate(config.keys.account.pkey, "pem", "raw"), "hex").toString("base64");
logger.info({ raw, pem: config.keys.account.pkey }, "keys");

export const accountKey = crypto.createECDH(config.auth.curves);
accountKey.setPrivateKey(raw, "base64");
