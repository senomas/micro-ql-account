import 'reflect-metadata';

import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';

import { config } from './config';
import AccountResolver from './resolvers/account';
import AuthResolver from './resolvers/auth';
import { Mongodb, MongoModel, mongodb } from './services/mongodb';
import { logger } from './services/service';

import fs = require("fs");
import path = require("path");

import { initUser } from './services/user';

export async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [AuthResolver, AccountResolver],
    emitSchemaFile: true,
    dateScalarMode: "isoDate"
  });

  await mongodb.init(config);
  initUser();

  const data = fs.readdirSync(path.resolve("./dist/data"));
  data.sort();
  for (const fn of data) {
    if (fn.endsWith(".js")) {
      const cfn = `./data/${fn.slice(0, -3)}`;
      logger.info({ fileName: cfn }, "import script");
      await require(cfn)({ mongodb });
    } else if (fn.endsWith(".json")) {
      const model = fn.split(".")[0];
      logger.info({ model: model, fileName: fn }, "load data");
      await mongodb.models[model].load(JSON.parse(fs.readFileSync(path.resolve("dist", "data", fn)).toString()));
    }
  }

  const server = new ApolloServer({
    schema,
    playground: true
  });

  const serverInfo = await server.listen(process.env.PORT || 4000);
  logger.info({ serverInfo }, "Server is running");
}

bootstrap();
