const shell = require("shelljs");

async function build() {
  await shell.exec("yarn build", {
    async: false
  });
}

async function run() {
  await build();
  await shell.exec("node dist/src/server.js", {
    async: false
  });
}

async function test() {
  await build();
  await shell.exec("node dist/src/server.js", {
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
  build,
  run,
  test
}
