import "mocha";

import chai = require("chai");
import { expect } from "chai";
import chaiHttp = require("chai-http");
import fs = require("fs");
import crypto = require("crypto");
import yaml = require("js-yaml");

chai.use(chaiHttp);

export const values = {} as any;
let config: any = null;

export class BaseTest {

  protected http = (chai as any).request(process.env.TEST_SERVER);
  protected config: any = config;

  public async before() {
    if (!this.config) {
      this.config = config = yaml.safeLoad(fs.readFileSync("config.yaml").toString());
      this.config.modules = {};
      if (fs.existsSync("module.yaml")) {
        const gmods = yaml.safeLoad(fs.readFileSync("module.yaml").toString());
        Object.entries(gmods).forEach((v: any) => {
          if (v[1].subs) {
            this.config.modules[v[0]] = v[1].subs;
          }
        });
      }
    }
  }

  public async postLogin(username, password) {
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
      aes.update(Buffer.from(username, "utf8")),
      aes.final()
    ]).toString("base64");

    res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          salt(xlogin: "${xlogin}")
        }
      }`
    });
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
      password,
      Buffer.from(salt, "base64"),
      this.config.auth.pbkdf2.iterations,
      this.config.auth.pbkdf2.hashBytes,
      "sha512"
    );

    const xhpassword = Buffer.concat([
      aes.update(hpassword),
      aes.final()
    ]).toString("base64");

    res = await this.http.post("/graphql").send({
      query: `{
        auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
          login(xlogin: "${xlogin}", xhpassword: "${xhpassword}") {
            seq token refresh
          }
        }
      }`
    });
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
    values.seq = parseInt(res.body.data.auth.login.seq, 10);
    values.token = res.body.data.auth.login.token;
    values.refresh = res.body.data.auth.login.refresh;
  }
}
