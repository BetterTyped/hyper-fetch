#!/usr/bin/env node

import { Command } from "commander";
import * as process from "process";
import * as fs from "fs";
import * as path from "path";
import { Client } from "@hyper-fetch/core";

import { Document, OpenapiRequestGenerator } from "../openapi";
import { isUrl } from "../openapi/utils";

const program = new Command();

program
  .name("Hyper Fetch openapi-generator")
  .description("Generates HF Requests from the provided openapi schema (V3)")
  .version("1.0.0");

program.requiredOption("-s, --schema [path]", "path or url to the openapi schema");
program.option("-n, --name [path]", "path to the resulting file");

program.parse(process.argv);

const options = program.opts() as { schema: string; name?: string };

const main = async (opts: { schema: string; name?: string }) => {
  let openapiSchema;
  if (isUrl(opts.schema)) {
    const client = new Client({ url: opts.schema });
    const getSchema = client.createRequest<Document>()({ endpoint: "" });
    const { data, error } = await getSchema.send();
    if (error) {
      throw error;
    } else {
      openapiSchema = data;
    }
  } else {
    const f = fs.readFileSync(path.join(process.cwd(), opts.schema), "utf-8");
    openapiSchema = JSON.parse(f);
  }

  const generator = new OpenapiRequestGenerator(openapiSchema);
  await generator.generateFile(opts?.name);
};

main(options)
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.log("Generation failed", e);
    process.exit(1);
  })
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Generation finished");
    process.exit(1);
  });
