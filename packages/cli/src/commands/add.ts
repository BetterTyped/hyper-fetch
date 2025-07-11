import { Command } from "commander";
import { checkbox, confirm } from "@inquirer/prompts";
import { z } from "zod";

// import { Registry } from "registry/schema";
import { logger } from "../utils/logger";
import { handleError } from "../utils/handle-error";
import { preFlightAdd } from "preflights/preflight-add";

// const registry: Registry[] = getRegistry();

export const addOptionsSchema = z.object({
  sdks: z.array(z.string()).optional(),
  yes: z.boolean(),
  overwrite: z.boolean(),
  srcDir: z.boolean(),
  cwd: z.string(),
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

export const add = new Command()
  .name("Add")
  .description("Add SDK from registry to your project")
  .argument("[sdks...]", "names, url or local path to the sdks")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option("--src-dir", "use the src directory when creating a new project.", false)
  .option("--no-src-dir", "do not use the src directory when creating a new project.")
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .action(async (sdks: string[], opts: z.infer<typeof addOptionsSchema>) => {
    try {
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

      // const packageManager = await getPackageManager(options.cwd);
      // await execa(packageManager, ["add", ...selectedSdks], {
      //   stdio: "inherit",
      //   cwd: options.cwd,
      // });

      for (const sdk of selectedSdks) {
        // const item = registry.find((s) => s.meta.name === sdk)!;
        // const sdkPath = item.versions[item.versions.length - 1].path;
      }

      logger.success("SDKs installed successfully!");
    } catch (error) {
      handleError(error);
    }
  });
