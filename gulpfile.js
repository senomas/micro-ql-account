const { dest, src } = require("gulp");
const shell = require("shelljs");
const { spawn } = require('child_process');
const args = require("yargs").argv;

async function tsc() {
  await shell.exec("npx tsc -p .", {
    async: false
  });
}

async function build() {
  await tsc();
  await copyData();
}

async function copyData() {
  return src("src/data/*.{json,yaml}").pipe(dest("dist/data"));
}

async function dockerUp() {
  await shell.exec("docker-compose -p micro-ql up -d", {
    async: false
  });
}

async function dockerDown() {
  await shell.exec("docker-compose -p micro-ql down", {
    async: false
  });
}

async function run() {
  await build();
  await dockerUp();
  await shell.exec("node dist/server.js", {
    async: false
  });
}

async function test() {
  await build();
  const proc = spawn("node", ["dist/server.js"], {
    env: {
      TEST: true
    }
  });
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  console.log(
    `npx mocha -r ts-node/register ${
    args.bail ? "-b" : ""
    } --color -t 90000 test/**/*${args.mod ? `${args.mod}*` : ""}.spec.ts`
  );
  shell.exec(
    `npx mocha -r ts-node/register  ${
    args.bail ? "-b" : ""
    } --color -t 90000 test/**/*${args.mod ? `${args.mod}*` : ""}.spec.ts`,
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
  tsc,
  copyData,
  build,
  dockerUp,
  dockerDown,
  run,
  test
}
