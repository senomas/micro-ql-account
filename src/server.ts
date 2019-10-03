require('source-map-support').install();
import 'reflect-metadata';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'type-graphql';

import { getUser } from './authentication';
import { customAuthChecker } from './authorization';
import { config } from './config';
import { AuthResolver } from './resolvers/auth';
import { RoleResolver } from './resolvers/role';
import { UserResolver } from './resolvers/user';
import { mongodb } from './services/mongodb';
import { initRole } from './services/role';
import { logger } from './services/service';
import { initUser } from './services/user';

import fs = require("fs");
import path = require("path");
export async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [AuthResolver, RoleResolver, UserResolver, null],
    authChecker: customAuthChecker,
    emitSchemaFile: true,
    dateScalarMode: "isoDate"
  });

  await mongodb.init(config);
  await initUser();
  await initRole();

  const data = fs.readdirSync(path.resolve("./dist/data"));
  data.sort();
  for (const fn of data) {
    if (fn.endsWith(".js")) {
      const cfn = `./data/${fn.slice(0, -3)}`;
      logger.info({ fileName: cfn }, "import script");
      await require(cfn)({ mongodb });
    } else if (fn.endsWith(".json")) {
      const model = fn.split(".")[2];
      logger.info({ model: model, fileName: fn }, "load data");
      await mongodb.models[model].load(JSON.parse(fs.readFileSync(path.resolve("dist", "data", fn)).toString()));
    }
  }

  const server = new ApolloServer({
    schema,
    playground: true,
    context: ({ req }) => {
      const user = getUser(req);
      // logger.info({ req, user }, "authentication middleware");
      return { user };
    }
  });

  const app = express();
  server.applyMiddleware({ app });

  const serverInfo = await app.listen(process.env.PORT || 4000);
  logger.info({ serverInfo }, "Server is running");
}

bootstrap();
