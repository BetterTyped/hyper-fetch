import { Command } from "commander";
import { z } from "zod";
import { input, select } from "@inquirer/prompts";
import { handleError } from "utils/handle-error";
import { preFlightGenerate } from "preflights/preflight-generate";
import { OpenapiRequestGenerator } from "codegens/openapi/generator";
import { spinner } from "utils/spinner";

export const generateOptionsSchema = z.object({
  template: z.enum(["openapi", "swagger"]).optional(),
  url: z.url("A valid URL must be provided.").optional(),
  cwd: z.string(),
  output: z.string(),
  dir: z.string(),
});

export const generate = new Command()
  .name("Generate SDK")
  .description("Generate SDK from a schema, url or service")
  .option("-t, --template <template>", "API provider template to use")
  .option("-u, --url <url>", "The URL to generate the schema from")
  .option("-o, --output <output>", "The output file for the SDK.")
  .option("-d, --dir <dir>", "The directory to generate the SDK in.")
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .action(async (opts: z.infer<typeof generateOptionsSchema>) => {
    try {
      const { config } = await preFlightGenerate(opts);

      const options = generateOptionsSchema.parse(opts);

      let { template, url } = options;

      if (!template) {
        template = await select({
          message: "What source we want to use?",
          choices: [
            { name: "OpenAPI (v3)", value: "openapi" },
            { name: "Swagger", value: "swagger" },
          ],
        });
      }

      if (!url) {
        url = await input({
          message: "Enter the URL to generate the schema from:",
          validate: (value) => {
            const result = z.url("Please enter a valid URL.").safeParse(value);
            if (result.success) return true;
            return result.error.message;
          },
        });
      }

      const componentSpinner = spinner(`Writing components.json.`).start();
      switch (template) {
        case "openapi": {
          const openapiSchema = await OpenapiRequestGenerator.getSchemaFromUrl({ url, config });
          const generator = new OpenapiRequestGenerator(openapiSchema);
          await generator.generateFile({ fileName: opts?.output, config });
          componentSpinner.succeed();
          return process.exit(0);
        }
        case "swagger": {
          const openapiSchema = await OpenapiRequestGenerator.getSchemaFromUrl({ url, config });
          const generator = new OpenapiRequestGenerator(openapiSchema);
          await generator.generateFile({ fileName: opts?.output, config });
          componentSpinner.succeed();
          return process.exit(0);
        }
        default: {
          componentSpinner.fail();
          throw new Error(`Invalid template: ${template}`);
        }
      }
    } catch (err) {
      handleError(err);
    }
  });
