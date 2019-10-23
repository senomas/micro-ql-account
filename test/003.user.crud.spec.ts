import "mocha";
import { expect } from "chai";
import crypto from "crypto";
import { suite, test } from "mocha-typescript";

import { BaseTest, values } from "./base";

@suite
export class UserCrudTest extends BaseTest {

  @test
  public async testLogin() {
    await this.postLogin("admin", "dodol123");
  }

  @test
  public async testListUsers() {
    const res = await this.post(`{
      users(skip: 1) {
        total
        items {
          id
          login
          name
          roles
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListUsersByNameRegex() {
    const res = await this.post(`{
    users(filter: { nameRegex: "u" }) {
        total
        items {
          id
          login
          name
          roles
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListUsersRoles() {
    const res = await this.post(`{
      roles {
        total
        items {
          id
          code
          name
          privileges
        }
      }
      users {
        total
        items {
          id
          login
          name
          roles
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data, res.log).to.haveOwnProperty("users");
    expect(res.body.data, res.log).to.haveOwnProperty("roles");
    expect(res.body.data.roles.items.length, res.log).to.eql(3);
    expect(res.body.data.users.items.length, res.log).to.eql(4);
  }

  @test
  public async testLoginJuniorStaff() {
    await this.postLogin("citra", "dodol123");
  }

  @test
  public async testListUsersRolesFailed() {
    const res = await this.post(`{
      users {
        total
        items {
          id
          login
          name
          roles
        }
      }
      roles {
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
    expect(res.body, res.log).to.haveOwnProperty("errors");
  }
}
