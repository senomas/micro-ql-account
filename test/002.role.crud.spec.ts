import "mocha";

import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest, values } from "./base";

@suite
export class RoleCrudTest extends BaseTest {

  @test
  public async testLogin() {
    await this.postLogin("admin", "dodol123");
  }

  @test
  public async testListRoles() {
    const res = await this.post(`{
      roles(skip: 1) {
        total
        items {
          id
          code
          name
          privileges
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    values.items = res.body.data.roles.items;
  }

  @test
  public async testFindByID() {
    const res = await this.post(`{
      role(id: "${values.items[0].id}") {
        id
        code
        name
        privileges
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListRolesByCode() {
    const res = await this.post(`{
      roles(filter: { code: "admin" }) {
        total
        items {
          id
          code
          name
          privileges
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListRolesByNameRegex() {
    const res = await this.post(`{
      roles(filter: { nameRegex: "a" }) {
        total
        items {
          id
          code
          name
          privileges
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.roles.total, res.log).to.eql(2);
  }

  @test
  public async insertNewRole() {
    const res = await this.post(`mutation {
      addRole(data: {code: "demo", name: "Demo", privileges: ["demo"]}) {
        id
        code
        name
        privileges
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async updateRole() {
    const res = await this.post(`mutation {
      updateRoles(filter: { code: "demo" }, data: {name: "Demox", privileges: ["demox"]}) {
        matched
        modified
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.updateRoles.modified, res.log).to.eql(1);
  }

  @test
  public async deleteRoles() {
    const res = await this.post(`mutation {
      deleteRoles(filter: { code: "demo" }) {
        deleted
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.deleteRoles.deleted, res.log).to.eql(1);
  }
}
