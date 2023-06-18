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
  .version("0.1.0");

program.requiredOption("-s, --path [path]", "path or url to the openapi schema");

program.parse(process.argv);

const options = program.opts() as { path: string };

const main = async (opts: { path: string }) => {
  let openapiSchema;
  if (isUrl(opts.path)) {
    const client = new Client({ url: opts.path });
    const getSchema = client.createRequest<Document>()({ endpoint: "" });
    const { data, error } = await getSchema.send();
    if (error) {
      throw error;
    } else {
      openapiSchema = data;
    }
  } else {
    const f = fs.readFileSync(path.join(process.cwd(), opts.path), "utf-8");
    openapiSchema = JSON.parse(f);
  }

  const generator = new OpenapiRequestGenerator(openapiSchema);
  await generator.generateFile();
};

main(options).catch((e) => console.log(e));
