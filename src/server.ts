require('source-map-support').install();
import 'reflect-metadata';
import "./services/service";

import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'type-graphql';

import { logger, NODE_ENV } from './services/service';
import { mongodb } from './services/mongodb';
import { initRole } from './services/role';
import { initUser } from './services/user';
import { initMovie } from './services/movie';
import { getUser } from './authentication';
import { customAuthChecker } from './authorization';
import { config } from './config';
import { AuthResolver } from './resolvers/auth';
import { RoleResolver } from './resolvers/role';
import { UserResolver } from './resolvers/user';
import { MovieResolver } from './resolvers/movie';

import fs = require("fs");
import path = require("path");
export async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [AuthResolver, RoleResolver, UserResolver, MovieResolver],
    authChecker: customAuthChecker,
    authMode: "null",
    emitSchemaFile: true,
    dateScalarMode: "isoDate"
  });

  await mongodb.init(config);
  await initUser();
  await initRole();
  await initMovie();

  const data = fs.readdirSync(path.resolve("./dist/data"));
  data.sort();
  const versionRow = (await mongodb.db.collection("version").findOne({ code: "populate" }));
  let version = versionRow && versionRow.version !== null ? versionRow.version : -1;
  if (!versionRow) {
    await mongodb.db.collection("version").insertOne({
      code: "populate",
      version: -1
    });
  }
  let lcver = version;
  let cver = version;
  const models = {};
  for (const fn of data) {
    const fns = fn.split(".");
    const model = fns[2];
    cver = parseInt(fns[0]);
    if (cver <= version) {
      logger.info({ model: model, cver, version, fileName: fn }, "skip");
    } else {
      if (NODE_ENV === "development" || NODE_ENV === "test") {
        if (!models[model]) {
          try {
            await mongodb.db.collection(model).drop();
          } catch (err) {
            if (err.message && err.message.indexOf("ns not found") >= 0) {
              // skip
            } else {
              throw err;
            }
          }
          models[model] = true
        }
      }
      if (fn.endsWith(".js")) {
        const cfn = `./data/${fn.slice(0, -3)}`;
        logger.info({ model: model, cver, fileName: cfn }, "import script");
        await require(cfn)({ mongodb });
      } else if (fn.endsWith(".json")) {
        logger.info({ model: model, cver, fileName: fn }, "load data");
        const data = JSON.parse(fs.readFileSync(path.resolve("dist", "data", fn)).toString());
        const res = await mongodb.models[model].load(data);
        logger.info({ model: model, cver, fileName: fn, res }, "load data res");
      }
      logger.info({ version, cver, lcver }, "after update");
      if (cver < 900) {
        if (cver !== lcver) {
          if (cver > 0 && lcver > version) {
            const ures = await mongodb.db.collection("version").updateOne({
              code: "populate",
              version
            }, {
              $set: {
                version: lcver
              }
            }, { upsert: true });
            if (ures.modifiedCount !== 1) {
              delete ures.connection
              delete ures.message
              throw {
                name: "UpdateError",
                version,
                cver,
                lcver,
                ures
              }
            }
            version = lcver;  
          }
          lcver = cver;
        }
      }
    }
  }
  logger.info({ cver, version }, "after updates");
  if (cver < 900 && cver !== version) {
    const ures = await mongodb.db.collection("version").updateOne({
      code: "populate",
      version
    }, {
      $set: {
        version: cver
      }
    }, { upsert: true });
    if (ures.modifiedCount !== 1) {
      delete ures.connection
      delete ures.message
      throw {
        name: "UpdateError",
        version,
        lcver,
        cver,
        ures
      }
    }
    version = cver;
  }

  const server = new ApolloServer({
    schema,
    playground: true,
    context: async ({ req }) => {
      const user = await getUser(req);
      const remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      return { user, headers: req.headers, remoteAddress };
    }
  });

  const app = express();
  server.applyMiddleware({ app });

  const serverInfo = await app.listen(process.env.PORT || 4000);
  logger.info({ serverInfo }, "Server is running");
}

bootstrap().catch(err => {
  console.error("server error", err);
  process.exit(-1);
});
