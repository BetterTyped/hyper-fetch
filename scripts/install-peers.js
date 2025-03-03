/* eslint-disable */
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const executioner = require("executioner");

const die = (message) => console.error(chalk.bold.red(message));
const warn = (message) => console.warn(chalk.yellow(message));
const status = (message) => console.warn(chalk.bold.white(message));
const success = (message) => console.warn(chalk.green(message));

class Package {
  constructor(contents) {
    try {
      this.contents = JSON.parse(contents);
    } catch (error) {
      this.contents = null;
    }
  }

  isValid() {
    return this.contents !== null;
  }

  hasPeerDependencies() {
    return this.contents.peerDependencies !== undefined;
  }

  get peerDependencies() {
    return this.contents.peerDependencies || [];
  }

  get peerInstallOptions() {
    return this.contents.peerInstallOptions || {};
  }
}

let yarnBin;
const matched = `${path.sep}bin${path.sep}yarn.js`;
if (process.env["npm_execpath"] && process.env["npm_execpath"].includes(matched)) {
  yarnBin = path.resolve(process.env["npm_execpath"]);
}
const envLabel = "install_peers_skip";

if (yarnBin && process.env[envLabel] !== "1") {
  let peerDependencies = {};
  fs.readdirSync("./packages", { encoding: "utf-8" }).forEach((dir) => {
    try {
      if (dir.includes("DS_Store")) return;

      const contents = fs.readFileSync(`./packages/${dir}/package.json`);

      if (contents === undefined) {
        return console.log(`There doesn't seem to be a package.json in packages/${dir}/package.json`);
      }

      let packageContents = new Package(contents);

      if (!packageContents.isValid()) {
        return die("Invalid package.json contents\n");
      }

      if (!packageContents.hasPeerDependencies()) {
        return warn(`Package ${dir} doesn't seem to have any peerDependencies\n`);
      }
      peerDependencies = {
        ...peerDependencies,
        ...packageContents.peerDependencies,
      };
    } catch (err) {
      warn(err);
    }
  });
  process.env[envLabel] = "1";

  const packages = [...new Set(Object.keys(peerDependencies))]
    .filter((key) => {
      return !key.includes("@hyper-fetch");
    })
    .map(function (key) {
      return `${key}@${peerDependencies[key]}`;
    });

  success(`Peer dependencies found - ${packages.join(", ")}...\n`);

  var options = {
    node: process.argv[0],
    yarn: yarnBin,
    // escape package names@versions
    packages: packages.map((pkg) => `"${pkg}"`).join(" "),
    ignoreWorkspaceRootCheck: "",
  };

  if (!packages.length) {
    return status(`No packages to install.\n`);
  }

  executioner(
    '"${node}" "${yarn}" add ${ignoreWorkspaceRootCheck} --peer --pure-lockfile --prefer-offline -W ${packages}',
    options,
    function (error) {
      process.env[envLabel] = "0";
      if (error) {
        console.log(error);
        die("Installation failed", error);
        return process.exit();
      }
      success("+ Successfully installed " + packages.length + " peerDependencies via yarn.\n");
      return process.exit();
    },
  );

  // Looks like yarn shows last line from the output of sub-scripts
  status("- Installing " + packages.length + " peerDependencies...\n");
}
