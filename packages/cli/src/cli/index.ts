#!/usr/bin/env node
import { Command } from "commander";
import { select } from "@inquirer/prompts";

import { generate } from "../commands/generate";
import pkg from "../../package.json";

const program = new Command();

program.name("hyper-fetch").description("CLI for Hyper Fetch").version(pkg.version);

program.addCommand(generate);

program.action(async () => {
  const chosenCommand = await select({
    message: "What do you want to do?",
    choices: program.commands.map((cmd) => ({
      name: cmd.name(),
      value: cmd.name(),
      description: cmd.description(),
    })),
  });

  await program.parseAsync([process.argv[0], process.argv[1], chosenCommand]);
});

program.parse(process.argv);
