import * as bunyan from "bunyan";
import { GraphQLServer } from "graphql-yoga";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import AuthResolver from "./resolvers/auth";
import AccountResolver from "./resolvers/account";

async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [AuthResolver, AccountResolver],
    emitSchemaFile: true,
  });

  const server = new GraphQLServer({
    schema,
  });

  server.start({
    endpoint: "/graphql",
    playground: '/graphql'
  }, () => console.log("Server is running on http://localhost:4000"));
}

bootstrap();
