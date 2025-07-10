import { Command } from "commander";
import { z } from "zod";
import { input, select } from "@inquirer/prompts";

const generateOptionsSchema = z.object({
  template: z.enum(["openapi", "swagger"]).optional(),
  url: z.string().url("A valid URL must be provided.").optional(),
  cwd: z.string(),
});

export const generate = new Command()
  .name("generate")
  .description("Generate SDK from a schema, url or service")
  .option("-t, --template <template>", "The template to use (openapi or swagger)")
  .option("-u, --url <url>", "The URL to generate the schema from")
  .option("-c, --cwd <cwd>", "the working directory. defaults to the current directory.", process.cwd())
  .action(async (opts) => {
    const options = generateOptionsSchema.parse(opts);

    let { template, url } = options;

    if (!template) {
      template = await select({
        message: "What source we want to use?",
        choices: [
          { name: "OpenAPI", value: "openapi" },
          { name: "Swagger", value: "swagger" },
        ],
      });
    }

    if (!url) {
      url = await input({
        message: "Enter the URL to generate the schema from:",
        validate: (value) => {
          const result = z.string().url("Please enter a valid URL.").safeParse(value);
          if (result.success) return true;
          return result.error.errors[0].message;
        },
      });
    }

    console.log(`Generating schema from ${template} at ${url}...`);
  });
