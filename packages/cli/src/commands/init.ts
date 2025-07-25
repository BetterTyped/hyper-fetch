import { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { z } from "zod";
import * as path from "node:path";
import * as fs from "fs-extra";

import { handleError } from "../utils/handle-error";
import { spinner } from "../utils/spinner";
import { configSchema, Config } from "config/schema";
import { logger } from "utils/logger";
import { getTsConfigAliasPrefix } from "config/get-ts-alias";
import { showHelp } from "utils/show-help";

const initOptionsSchema = z.object({
  yes: z.boolean().optional().describe("skip confirmation prompt."),
  cwd: z.string().describe("the working directory. defaults to the current directory."),
});

type Step = {
  name: string;
  action: (config: Partial<Config>) => Promise<Partial<Config> | void>;
};

export const init = new Command()
  .name("Init")
  .description("Initialize HyperFetch Client configuration.")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .option("-h, --help <help>", "display help for command")
  .action(async (opts) => {
    try {
      const help = process.argv.includes("--help") || process.argv.includes("-h");

      if (help) {
        return showHelp(initOptionsSchema);
      }

      const { cwd, yes } = initOptionsSchema.parse(opts);

      let config: Partial<Config> = {};

      let mainPath: string;
      let apiDir: string;

      if (yes) {
        mainPath = "src";
        apiDir = "api";
      } else {
        // 1. ask for the path to the main directory
        mainPath = await select({
          message: "Select the main directory for your project:",
          choices: [
            { name: "src", value: "src" },
            { name: "app", value: "app" },
            { name: "other", value: "other" },
          ],
        });

        if (mainPath === "other") {
          mainPath = await input({
            message: "Enter the path to the main directory:",
            validate: (value) => {
              if (!value) return "Path cannot be empty.";
              return true;
            },
          });
        }

        // 2. text field - asking for the directory of api
        apiDir = await input({
          message: "Enter the name of the API directory:",
          default: "api",
          validate: (value) => {
            if (!value) return "Directory name cannot be empty.";
            return true;
          },
        });
      }

      const fullPath = path.join(cwd, mainPath, apiDir);
      const relativePath = path.join(mainPath, apiDir);
      const configPath = path.join(cwd, "api.json");

      const aliasPrefix = (await getTsConfigAliasPrefix(cwd)) || "";
      const alias = aliasPrefix ? `${aliasPrefix}/` : "";

      const defaultAliases: Config["aliases"] = {
        api: `${alias}${apiDir}`,
        hooks: `${alias}hooks`,
        ui: `${alias}components/ui`,
        components: `${alias}components`,
        lib: `${alias}lib`,
      };

      const defaultConfig: Omit<Config, "resolvedPaths"> = {
        tsx: true,
        aliases: defaultAliases,
      };

      logger.break();

      const steps: Step[] = [
        {
          name: `Initialize API directory at ${relativePath}`,
          action: async () => {
            if (!fs.existsSync(fullPath)) {
              await fs.mkdir(fullPath, { recursive: true });
            }
          },
        },
        {
          name: "Setup configuration",
          action: async (currentConfig) => {
            if (fs.existsSync(configPath)) {
              const existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
              const { success, error, data } = configSchema.omit({ resolvedPaths: true }).safeParse({
                ...defaultConfig,
                ...existingConfig,
                aliases: {
                  ...defaultConfig.aliases,
                  ...existingConfig.aliases,
                },
              });

              if (error) {
                logger.break();
                logger.error(`Invalid configuration found in ${configPath}.`);
                handleError(error);
                logger.break();
              }

              if (success) {
                return data;
              }
            }
            return currentConfig;
          },
        },
        {
          name: "Setup Aliases",
          action: async (currentConfig) => {
            if (currentConfig.aliases) {
              return currentConfig;
            }

            return {
              ...currentConfig,
              aliases: defaultAliases,
            };
          },
        },
        {
          name: `Create api.json configuration file`,
          action: async (currentConfig) => {
            const finalConfig = {
              ...defaultConfig,
              ...currentConfig,
              aliases: {
                ...defaultConfig.aliases,
                ...currentConfig.aliases,
              },
            };

            configSchema.omit({ resolvedPaths: true }).parse(finalConfig);

            await fs.writeFile(configPath, JSON.stringify(finalConfig, null, 2));
          },
        },
      ];

      logger.break();
      logger.info("Starting HyperFetch CLI initialization...");

      // eslint-disable-next-line no-restricted-syntax
      for (const step of steps) {
        const s = spinner(step.name).start();
        // eslint-disable-next-line no-await-in-loop
        const result = await step.action(config);
        if (result) {
          config = result;
        }
        s.succeed();
      }

      logger.break();
      logger.info("Configuration has been generated successfully! 🎉");
      logger.info(`You can now find your configuration at ${configPath}`);
    } catch (err) {
      handleError(err);
    }
  });
