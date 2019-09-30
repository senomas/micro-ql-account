import chai = require("chai");
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
}
