import { Command } from "commander";
import { checkbox, confirm } from "@inquirer/prompts";
import { z } from "zod";

// import { Registry } from "registry/schema";
import { logger } from "../utils/logger";
import { handleError } from "../utils/handle-error";
import { preFlightAdd } from "preflights/preflight-add";
import { showHelp } from "utils/show-help";

// const registry: Registry[] = getRegistry();

export const addOptionsSchema = z.object({
  sdks: z.array(z.string()).optional().describe("names, url or local path to the sdks"),
  yes: z.boolean().optional().describe("skip confirmation prompt."),
  overwrite: z.boolean().optional().describe("overwrite existing files."),
  cwd: z.string().describe("the working directory. defaults to the current directory."),
});

async function promptForSdks() {
  const sdks = await checkbox({
    message: "Which SDKs would you like to add?",
    choices: [] as { name: string; value: string }[],
    // choices: registry.map((sdk) => ({
    //   name: sdk.meta.name,
    //   value: sdk.meta.name,
    // })),
  });

  return sdks;
}

// TODO: figure out a way to add sdks from registry?
export const add = new Command()
  .name("Add")
  .description("Add SDK from registry to your project")
  .argument("[sdks...]", "names, url or local path to the sdks")
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option("-h, --help <help>", "display help for command")
  .action(async (sdks: string[], opts: z.infer<typeof addOptionsSchema>) => {
    try {
      const help = process.argv.includes("--help") || process.argv.includes("-h");

      if (help) {
        return showHelp(addOptionsSchema);
      }

      await preFlightAdd({
        ...opts,
        sdks,
      });

      const options = addOptionsSchema.parse({
        sdks,
        ...opts,
      });

      let selectedSdks = options.sdks;
      if (!selectedSdks?.length) {
        selectedSdks = await promptForSdks();
      }

      if (!selectedSdks?.length) {
        logger.warn("No SDKs selected. Exiting.");
        process.exit(0);
      }

      if (!options.yes) {
        const proceed = await confirm({
          message: `Ready to install the following SDKs?\n  - ${selectedSdks.join("\n  - ")}`,
        });

        if (!proceed) {
          process.exit(0);
        }
      }

      logger.info("Installing SDKs...");

      // for (const sdk of selectedSdks) {
      //  TODO: implement
      // }

      logger.success("SDKs installed successfully!");
    } catch (error) {
      handleError(error);
    }
  });
