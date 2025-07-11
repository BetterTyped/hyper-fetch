#!/usr/bin/env node
import { Command } from "commander";
import { select } from "@inquirer/prompts";

import pkg from "../../package.json";
import { generate } from "commands/generate";
import { add } from "commands/add";
import { init } from "commands/init";

const program = new Command();

program.name("hyper-fetch").description("CLI for Hyper Fetch").version(pkg.version);

program.addCommand(init);
program.addCommand(add);
program.addCommand(generate);

program.action(async () => {
  try {
    const chosenCommand = await select({
      message: "What do you want to do?",
      choices: program.commands.map((cmd) => ({
        name: cmd.name(),
        value: cmd.name(),
        description: cmd.description(),
      })),
    });

    await program.parseAsync([process.argv[0], process.argv[1], chosenCommand]);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("User force closed the prompt")) {
        process.exit(0);
      }
    }
    process.exit(1);
  }
});

program.parse(process.argv);
