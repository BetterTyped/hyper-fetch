#!/usr/bin/env node
import { Command } from "commander";
import { select } from "@inquirer/prompts";

import pkg from "../../package.json";
import { generate } from "commands/generate";
import { init } from "commands/init";
import { handleError } from "utils/handle-error";

const program = new Command();

program.name("hyper-fetch").description("CLI for Hyper Fetch").version(pkg.version);

const commands = {
  init,
  // add,
  generate,
};

Object.values(commands).forEach((command) => {
  program.addCommand(command);
});

const main = async () => {
  try {
    let chosenCommand: string | undefined;

    if (process.argv[2] && Object.keys(commands).includes(process.argv[2])) {
      const command = commands[process.argv[2] as keyof typeof commands]!;
      chosenCommand = command.name();
    }

    if (!chosenCommand) {
      chosenCommand = await select({
        message: "What do you want to do?",
        choices: program.commands.map((cmd) => ({
          name: cmd.name(),
          value: cmd.name(),
          description: cmd.description(),
        })),
      });
      await program.parseAsync([process.argv[0], process.argv[1], chosenCommand]);
    } else {
      await program.parseAsync([process.argv[0], process.argv[1], chosenCommand, ...process.argv.slice(3)]);
    }
  } catch (e) {
    handleError(e);
    if (e instanceof Error) {
      if (e.message.includes("User force closed the prompt")) {
        process.exit(0);
      }
    }
    process.exit(1);
  }
};

main();
