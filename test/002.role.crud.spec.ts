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
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListRolesByCode() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `{
        roles(filter: { code: "admin" }) {
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
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
  }

  @test
  public async insertNewRole() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `mutation { 
        addRole(data: {code: "demo", name: "Demo", privileges: ["demo"]}) {
          id
          code
          name
          privileges
        }
      }`
    });
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
  }

  @test
  public async updateRole() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `mutation {
        updateRoles(filter: { code: "demo" }, data: {name: "Demox", privileges: ["demox"]}) {
          matched
          modified
        }
      }`
    });
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
    expect(res.body.data.updateRoles.modified, resLog).to.eql(1);
  }

  @test
  public async deleteRoles() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `mutation { 
        deleteRoles(filter: { code: "demo" }) {
          deleted
        }
      }`
    });
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
    expect(res.body.data.deleteRoles.deleted, resLog).to.eql(1);
  }
}
