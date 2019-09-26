import "mocha";

import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest } from "./base";

@suite
export class LoginTest extends BaseTest {

  @test
  public async testLogin() {
    console.log("LOGIN");
    const res = await this.http.post("/graphql").send({
      query: `{
      keychange(clientKey: "123123") {
        serverKey
      }
    }`});
    console.log("RES", res.status, res.body);
  }
}

