import { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { handleError } from "../utils/handle-error";
import { z } from "zod";
import path from "path";
import { existsSync, mkdir, readFileSync, writeFile } from "fs-extra";
import { spinner } from "../utils/spinner";
import { configSchema, Config } from "config/schema";
import { logger } from "utils/logger";
import { getTsConfigAliasPrefix } from "config/get-ts-alias";

const initOptionsSchema = z.object({
  cwd: z.string(),
});

type Step = {
  name: string;
  action: (config: Partial<Config>) => Promise<Partial<Config> | void>;
};

export const init = new Command()
  .name("Init")
  .description("Initialize HyperFetch Client configuration.")
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .action(async (opts) => {
    try {
      const { cwd } = initOptionsSchema.parse(opts);

      let config: Partial<Config> = {};

      // 1. ask for the path to the main directory
      let mainPath = await select({
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
      const apiDir = await input({
        message: "Enter the name of the API directory:",
        default: "api",
        validate: (value) => {
          if (!value) return "Directory name cannot be empty.";
          return true;
        },
      });

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
        $schema: "https://hyperfetch.bettertyped.com/api.json",
        tsx: true,
        aliases: defaultAliases,
      };

      const steps: Step[] = [
        {
          name: `Initialize API directory at ${relativePath}`,
          action: async () => {
            if (!existsSync(fullPath)) {
              await mkdir(fullPath, { recursive: true });
            }
          },
        },
        {
          name: "Setup configuration",
          action: async (currentConfig) => {
            if (existsSync(configPath)) {
              const existingConfig = JSON.parse(readFileSync(configPath, "utf8"));
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
            const defaultConfig: Omit<Config, "resolvedPaths"> = {
              $schema: "https://hyperfetch.bettertyped.com/api.json",
              tsx: true,
              aliases: {
                api: `${aliasPrefix}/${apiDir}`,
                hooks: `${aliasPrefix}/hooks`,
                ui: `${aliasPrefix}/components/ui`,
                components: `${aliasPrefix}/components`,
                lib: `${aliasPrefix}/lib`,
              },
            };

            const finalConfig = {
              ...defaultConfig,
              ...currentConfig,
              aliases: {
                ...defaultConfig.aliases,
                ...currentConfig.aliases,
              },
            };

            configSchema.omit({ resolvedPaths: true }).parse(finalConfig);

            await writeFile(configPath, JSON.stringify(finalConfig, null, 2));
          },
        },
      ];

      logger.break();
      logger.info("Starting HyperFetch CLI initialization...");

      for (const step of steps) {
        const s = spinner(step.name).start();
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
