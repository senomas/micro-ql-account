const { dest, src } = require("gulp");
const shell = require("shelljs");
const { spawn } = require("child_process");
const args = require("yargs").argv;
const gitlog = require("gitlog");
const fs = require("fs");

async function tsc() {
  await shell.exec("npx tsc -p .", {
    async: false
  });
}

async function build() {
  await tsc();
  await copyData();
  const commits = gitlog({
    repo: ".",
    number: 10,
    fields: ["hash", "abbrevHash", "subject", "authorName", "authorDate"]
  });
  fs.writeFileSync(
    "dist/build.json",
    JSON.stringify({ buildTime: new Date(), commits })
  );
}

async function copyData() {
  await new Promise(resolve => {
    src("src/data/*.{json,yaml}")
      .pipe(dest("dist/data"))
      .on("end", resolve);
  });
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
  await dockerUp();
  await build();
  await shell.exec("node dist/server.js", {
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "development",
      PORT: 5000
    },
    async: false
  });
}

async function test() {
  await shell.exec("rm -rf log dist", {
    async: false
  });
  await build();
  await dockerUp();
  const proc = spawn("node", ["dist/server.js"], {
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "test",
      PORT: 5000
    }
  });
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  // await new Promise(resolve => setTimeout(resolve, 3000));
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
        NODE_ENV: "test",
        TEST_SERVER: `http://localhost:5000`
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
};
