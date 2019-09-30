import "mocha";

import crypto = require("crypto");
import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest } from "./base";

@suite
export class LoginTest extends BaseTest {

  @test
  public async testLogin() {
    const ecdh = crypto.createECDH(this.config.auth.curves);
    ecdh.generateKeys();
    let res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          serverKey
        }
      }`
    });
    console.log("RES", res.status, res.request.url, res.body);
    let val = res.body;
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(val, res.request.method + " " + res.request.url).to.haveOwnProperty("data");
    expect(val.data, res.request.method + " " + res.request.url).to.haveOwnProperty("auth");
    expect(val.data.auth, res.request.method + " " + res.request.url).to.haveOwnProperty("serverKey");
    const serverKey = val.data.auth.serverKey;

    const secretkey = ecdh.computeSecret(
      Buffer.from(serverKey, "base64")
    );
    const aesKey = crypto
      .pbkdf2Sync(
        secretkey,
        this.config.auth.salt,
        this.config.auth.aesKey.iterations,
        this.config.auth.aesKey.hashBytes,
        "sha512"
      );
    const aesSalt = crypto
      .pbkdf2Sync(
        ecdh.getPublicKey(),
        this.config.auth.salt,
        this.config.auth.aesSalt.iterations,
        this.config.auth.aesSalt.hashBytes,
        "sha512"
      );
    let aes = crypto.createCipheriv("aes-256-ctr", aesKey, aesSalt);
    const xlogin = Buffer.concat([
      aes.update(Buffer.from("admin", "utf8")),
      aes.final()
    ]).toString("base64");

    res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          salt(xlogin: "${xlogin}")
        }
      }`
    });
    console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    val = res.body;
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(val, res.request.method + " " + res.request.url).to.haveOwnProperty("data");
    expect(val.data, res.request.method + " " + res.request.url).to.haveOwnProperty("auth");
    expect(val.data.auth, res.request.method + " " + res.request.url).to.haveOwnProperty("salt");
    const xsalt = val.data.auth.salt;

    const aesd = crypto.createDecipheriv("aes-256-ctr", aesKey, aesSalt);
    const salt = Buffer.concat([
      aesd.update(Buffer.from(xsalt, "base64")),
      aesd.final()
    ]).toString("utf8");

    aes = crypto.createCipheriv("aes-256-ctr", aesKey, aesSalt);
    const hpassword = crypto.pbkdf2Sync(
      "dodol123",
      Buffer.from(salt, "base64"),
      this.config.auth.pbkdf2.iterations,
      this.config.auth.pbkdf2.hashBytes,
      "sha512"
    );
    console.log("HPASSWORD", hpassword.toString("base64"));

    const xhpassword = Buffer.concat([
      aes.update(hpassword),
      aes.final()
    ]).toString("base64");

    console.log("XHPASSWORD", xhpassword);

    res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          login(xlogin: "${xlogin}", xhpassword: "${xhpassword}") {
            seq token refresh
          }
        }
      }`
    });
    console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

