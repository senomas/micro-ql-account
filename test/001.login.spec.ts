import 'mocha';

import { expect } from 'chai';
import crypto from 'crypto';
import { suite, test } from 'mocha-typescript';

import { BaseTest, values } from './base';

@suite
export class LoginTest extends BaseTest {

  @test
  public async serverInfo() {
    let res = await this.post(`{
      accountInfo {
        host
        time,
        buildTime
        commits {
          hash
          abbrevHash
          subject
          authorName
          authorDate
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testLogin() {
    const ecdh = crypto.createECDH(this.config.auth.curves);
    ecdh.generateKeys();
    values.ecdh = ecdh;

    let res = await this.post(`{
      auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
        serverKey
      }
    }`);
    let val = res.body;
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(val, res.log).to.haveOwnProperty("data");
    expect(val.data, res.log).to.haveOwnProperty("auth");
    expect(val.data.auth, res.log).to.haveOwnProperty("serverKey");
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

    res = await this.post(`{
      auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
        salt(xlogin: "${xlogin}")
      }
    }`);
    val = res.body;
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(val, res.log).to.haveOwnProperty("data");
    expect(val.data, res.log).to.haveOwnProperty("auth");
    expect(val.data.auth, res.log).to.haveOwnProperty("salt");
    const xsalt = val.data.auth.salt;

    const aesd = crypto.createDecipheriv("aes-256-ctr", aesKey, aesSalt);
    const salt = Buffer.concat([
      aesd.update(Buffer.from(xsalt, "base64")),
      aesd.final()
    ]).toString("utf8");

    const hpassword = crypto.pbkdf2Sync(
      "dodol123",
      Buffer.from(salt, "base64"),
      this.config.auth.pbkdf2.iterations,
      this.config.auth.pbkdf2.hashBytes,
      "sha512"
    );
    // console.log("HPASSWORD", hpassword.toString("base64"));

    aes = crypto.createCipheriv("aes-256-ctr", aesKey, aesSalt);
    const xhpassword = Buffer.concat([
      aes.update(hpassword),
      aes.final()
    ]).toString("base64");
    // console.log("XHPASSWORD", xhpassword);

    res = await this.post(`{
      auth(clientKey: "${ecdh.getPublicKey().toString("base64")}") {
        login(xlogin: "${xlogin}", xhpassword: "${xhpassword}") {
          seq token
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    values.token = res.body.data.auth.login.token;
  }

  @test
  public async testCurrent() {
    const res = await this.post(`{
      me {
        clientKey
        xlogin
        name
        privileges
        token {
          seq
          token
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.me.token, res.log).to.eql(null);
  }

  @test
  public async testCurrentNoToken() {
    const res = await this.post(`{
      me {
        clientKey
        xlogin
        name
        privileges
        token {
          seq
          token
        }
      }
    }`, { token: null });
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.me.clientKey, res.log).to.eql(null);
    expect(res.body.data.me.privileges, res.log).to.eql([]);
  }

  // @test
  public async testExpiredToken() {
    await new Promise(resolve => setTimeout(resolve, 2100));
    const res = await this.post(`{
      me {
        clientKey
        xlogin
        name
        privileges
        token {
          seq
          token
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.me.token, res.log).to.not.eql(null);
  }

  @test
  public async testLogout() {
    await this.postLogout();
  }

  @test
  public async testRelogin() {
    await this.postLogin("admin", "dodol123");
  }

  // @test
  public async testReloginAfterTimeout() {
    await new Promise(resolve => setTimeout(resolve, 2100));
    await this.postLogin("admin", "dodol123");
  }
}

