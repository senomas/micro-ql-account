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
}

