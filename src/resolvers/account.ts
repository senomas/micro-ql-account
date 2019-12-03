import * as fs from 'fs';
import * as os from 'os';
import { Resolver, Query, Ctx } from "type-graphql";

import { ServerInfo, Error } from '../schemas/account';

@Resolver()
export class AccountResolver {

  @Query(returns => ServerInfo)
  public account(@Ctx() ctx): ServerInfo {
    const data = JSON.parse(fs.readFileSync("./dist/build.json").toString());
    return {
      host: os.hostname(),
      time: new Date(),
      buildTime: new Date(data.buildTime),
      commits: data.commits
        ? data.commits.map(v => ({
          ...v,
          authorDate: new Date(v.authorDate)
        }))
        : null
    };
  }
}
