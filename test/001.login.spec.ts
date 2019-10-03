import "mocha";

import crypto = require("crypto");
import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest, values } from "./base";

@suite
export class LoginTest extends BaseTest {

  @test
  public async testLogin() {
    const ecdh = crypto.createECDH(this.config.auth.curves);
    ecdh.generateKeys();
    values.ecdh = ecdh;

    let res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          serverKey
        }
      }`
    });
    // console.log("RES", res.status, res.request.url, res.body);
    let val = res.body;
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
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
    // console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    val = res.body;
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
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
    // console.log("HPASSWORD", hpassword.toString("base64"));

    const xhpassword = Buffer.concat([
      aes.update(hpassword),
      aes.final()
    ]).toString("base64");
    // console.log("XHPASSWORD", xhpassword);

    res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          login(xlogin: "${xlogin}", xhpassword: "${xhpassword}") {
            seq token refresh
          }
        }
      }`
    });
    // console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
    values.refresh = res.body.data.auth.login.refresh;
  }

  @test
  public async testRefresh() {
    const ecdh = values.ecdh;
    const res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          refresh(refresh: "${values.refresh}") {
            seq token refresh
          }
        }
      }`
    });
    // console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
    values.token = res.body.data.auth.refresh.token;
  }

  @test
  public async testCurrent() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `{
        me {
          clientKey
          xlogin
          name
          privileges
        }
      }`
    });
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
  }

  @test
  public async testCurrentNoToken() {
    const req = this.http.post("/graphql");
    const res = await req.send({
      query: `{
        me {
          clientKey
          xlogin
          name
          privileges
        }
      }`
    });
    // console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.haveOwnProperty("errors");
    expect(res.body.errors[0].message, res.request.method + " " + res.request.url).to.eql("Access denied! You need to be authorized to perform this action!");
  }
}

