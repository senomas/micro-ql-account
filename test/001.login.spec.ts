import "mocha";

import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest } from "./base";

@suite
export class LoginTest extends BaseTest {

  @test
  public async testLogin() {
    console.log("LOGIN");
  }
}

