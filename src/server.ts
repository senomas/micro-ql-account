import { GraphQLServer } from "graphql-yoga";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import AuthResolver from "./resolvers/auth";
import AccountResolver from "./resolvers/account";
import { logger } from "./services/service";

export async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [AuthResolver, AccountResolver],
    emitSchemaFile: true,
    dateScalarMode: "isoDate"
  });

  const server = new GraphQLServer({
    schema,
  });

  return new Promise(resolve => {
    server.start({
      endpoint: "/graphql",
      playground: '/graphql'
    }, () => {
      logger.info({ port: 4000 }, "Server is running");
      resolve();
    });
  })
}

bootstrap();
