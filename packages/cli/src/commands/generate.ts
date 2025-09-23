/* eslint-disable no-param-reassign */
import { Command } from "commander";
import { z } from "zod";
import * as path from "node:path";
import * as fs from "fs-extra";
import { input, select, confirm } from "@inquirer/prompts";

import { handleError } from "utils/handle-error";
import { preFlightGenerate } from "preflights/preflight-generate";
import { OpenapiRequestGenerator } from "features/codegen/openapi/generator";
import { spinner } from "utils/spinner";
import { logger } from "utils/logger";
import { showHelp } from "utils/show-help";

export const generateOptionsSchema = z.object({
  template: z.enum(["openapi", "swagger"]).describe("API provider template to use"),
  url: z.string().describe("The URL to generate the schema from"),
  fileName: z.string().describe("The output file for the SDK."),
  cwd: z.string().describe("The working directory. defaults to the current directory."),
  overwrite: z.boolean().optional().describe("Overwrite existing files."),
});

export const generate = new Command()
  .name("Generate")
  .description("Generate SDK from a schema, url or service")
  .option("-t, --template <template>", "API provider template to use")
  .option("-u, --url <url>", "The URL to generate the schema from")
  .option("-f, --fileName <fileName>", "The output file for the SDK.")
  .option("-o, --overwrite", "overwrite existing files.")
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .option("-h, --help <help>", "display help for command")
  .action(async (opts: z.infer<typeof generateOptionsSchema>) => {
    try {
      const help = process.argv.includes("--help") || process.argv.includes("-h");

      if (help) {
        return showHelp(generateOptionsSchema);
      }
      const { config } = await preFlightGenerate(opts);

      if (!opts.template) {
        opts.template = await select({
          message: "What source we want to use?",
          choices: [
            { name: "OpenAPI (v3)", value: "openapi" },
            { name: "Swagger", value: "swagger" },
          ],
        });
      }

      if (!opts.url) {
        opts.url = await input({
          message: "Enter the URL to generate the schema from:",
          validate: (value) => {
            const result = z.url("Please enter a valid URL.").safeParse(value);
            if (result.success) return true;
            return result.error.message;
          },
        });
      }

      if (!opts.fileName) {
        opts.fileName = await input({
          message: "Enter the file name for the SDK:",
          default: `api-${opts.template}.sdk.ts`,
        });
      }

      const fileExists = fs.existsSync(path.join(opts.cwd, opts.fileName));
      if (opts.overwrite === undefined && fileExists) {
        opts.overwrite = await confirm({ message: "Overwrite existing files?" });
      }

      if (opts.overwrite === false && fileExists) {
        return logger.info(`File ${opts.fileName} already exists. Use --overwrite to overwrite.`);
      }

      const options = generateOptionsSchema.parse(opts);

      const componentSpinner = spinner(`Writing ${options.fileName}...`).start();
      switch (options.template) {
        case "openapi": {
          const openapiSchema = await OpenapiRequestGenerator.getSchemaFromUrl({ url: options.url!, config });
          const generator = new OpenapiRequestGenerator(openapiSchema);
          await generator.generateFile({ fileName: options.fileName, config });
          componentSpinner.succeed();
          return process.exit(0);
        }
        case "swagger": {
          const openapiSchema = await OpenapiRequestGenerator.getSchemaFromUrl({ url: options.url!, config });
          const generator = new OpenapiRequestGenerator(openapiSchema);
          await generator.generateFile({ fileName: options.fileName, config });
          componentSpinner.succeed();
          return process.exit(0);
        }
        default: {
          componentSpinner.fail();
          throw new Error(`Invalid template: ${options.template}`);
        }
      }
    } catch (err) {
      handleError(err);
    }
  });
