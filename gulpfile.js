const shell = require("shelljs");
const { spawn } = require('child_process');

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
  const proc = spawn("node", ["dist/src/server.js"]);
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  console.log("npx mocha -r ts-node/register --color -t 90000 test/**/*.spec.ts");
  await shell.exec(
    `npx mocha -r ts-node/register --color -t 90000 test/**/*.spec.ts`,
    {
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "development",
        TEST_SERVER: `http://localhost:4000`,
        TEST: "true"
      },
      async: false
    }
  );
  proc.kill();
}

module.exports = {
  build,
  run,
  test
}
