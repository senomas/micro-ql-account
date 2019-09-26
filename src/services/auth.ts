import * as crypto from "crypto";
import Keychange from "../schemas/auth";
import { accountKey } from "./service";

export const auth = {
  keychange: (clientKey: string): Keychange => {
    const secretkey = accountKey.computeSecret(
      Buffer.from(clientKey, "base64")
    );
    return {
      serverKey: secretkey.toString("base64")
    }
  }
};
