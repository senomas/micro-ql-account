import "mocha";

import crypto = require("crypto");
import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest, values } from "./base";

@suite
export class RoleCrudTest extends BaseTest {

  @test
  public async testLogin() {
    this.postLogin("admin", "dodol123");
  }

  @test
  public async testListRoles() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `{
        roles(skip: 1) {
          total
          items {
            id
            code
            name
            privileges
          }
        }
      }`
    });
    console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListRolesByCode() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `{
        roles(code: "admin") {
          total
          items {
            id
            code
            name
            privileges
          }
        }
      }`
    });
    // console.log("RES", res.status, res.request.url, JSON.stringify(res.body, undefined, 2));
    expect(res.status, res.request.method + " " + res.request.url).to.eql(200);
    expect(res.body, res.request.method + " " + res.request.url).to.not.haveOwnProperty("errors");
  }
}

