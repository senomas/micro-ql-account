import 'mocha';

import { expect } from 'chai';
import crypto from 'crypto';
import { suite, test } from 'mocha-typescript';

import { BaseTest, values } from './base';

@suite
export class UserCrudTest extends BaseTest {

  @test
  public async testLogin() {
    this.postLogin("admin", "dodol123");
  }

  @test
  public async testListUsers() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `{
        users(skip: 1) {
          total
          items {
            id
            login
            name
            roles
          }
        }
      }`
    });
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListUsersByNameRegex() {
    const req = this.http.post("/graphql");
    req.set("Authorization", `Bearer ${values.token}`);
    const res = await req.send({
      query: `{
        users(filter: { nameRegex: "u" }) {
          total
          items {
            id
            login
            name
            roles
          }
        }
      }`
    });
    const resLog = `${res.request.method} ${res.request.url} ${JSON.stringify(res.body, undefined, 2)}`;
    expect(res.status, resLog).to.eql(200);
    expect(res.body, resLog).to.not.haveOwnProperty("errors");
  }
}

