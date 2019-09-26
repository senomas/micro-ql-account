const shell = require("shelljs");

async function generateSchema() {
  await shell.exec("npx graphql-schema-typescript generate-ts src/schema/schema.graphql --output src/schema.d.ts", {
    async: false
  });
}

async function build() {
  await generateSchema();
  await shell.exec("tsc -p .", {
    async: false
  });
  await shell.exec("ncp src/schema dist/schema", {
    async: false
  });
}

async function run() {
  await build();
  await shell.exec("node dist/server.js", {
    async: false
  });
}

async function test() {
  await build();
  await shell.exec("node dist/server.js", {
    async: true,
    silent: true
  });
  console.log("npx mocha -r ts-node/register --color -t 90000 test/**/*.spec.ts");
  await shell.exec(
    `npx mocha -r ts-node/register --color -t 90000 test/**/*.spec.ts`,
    {
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "development",
        TEST_SERVER: `http://localhost:3000`,
        TEST: "true"
      },
      async: false
    }
  );
  process.exit(0);
}

module.exports = {
  generateSchema,
  build,
  run,
  test
}