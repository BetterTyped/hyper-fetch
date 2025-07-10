import { Command } from "commander";
import { checkbox, confirm } from "@inquirer/prompts";
import { z } from "zod";

import { SDK } from "registry/types";
import { logger } from "../utils/logger";
import { handleError } from "../utils/handle-error";
import { readSdks } from "utils/read-sdks";
import { preFlightAdd } from "preflights/preflight-add";

const SDKS: SDK[] = readSdks();

export const addOptionsSchema = z.object({
  sdks: z.array(z.string()).optional(),
  yes: z.boolean(),
  cwd: z.string(),
});

async function promptForSdks() {
  const sdks = await checkbox({
    message: "Which SDKs would you like to add?",
    choices: SDKS.map((sdk) => ({
      name: sdk.meta.name,
      value: sdk.meta.name,
    })),
  });

  return sdks;
}

export const add = new Command()
  .name("Add SDK")
  .description("Add SDK from registry to your project")
  .argument("[sdks...]", "the sdks to add")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .action(async (sdks, opts) => {
    try {
      await preFlightAdd({
        sdks,
        yes: opts.yes,
        cwd: opts.cwd,
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

      // const packageManager = await getPackageManager(options.cwd);
      // await execa(packageManager, ["add", ...selectedSdks], {
      //   stdio: "inherit",
      //   cwd: options.cwd,
      // });

      for (const sdk of selectedSdks) {
        const item = SDKS.find((s) => s.meta.name === sdk)!;
        const sdkPath = item.versions[item.versions.length - 1].path;
      }

      logger.success("SDKs installed successfully!");
    } catch (error) {
      handleError(error);
    }
  });
