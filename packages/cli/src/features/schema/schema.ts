import { z } from "zod";

export const registryItemTypeSchema = z.enum([
  "registry:file",
  // API
  "registry:sdk",
  "registry:collection",
  "registry:query",
  // Logic
  "registry:hook",
  "registry:lib",
]);

export const registryItemFileSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  type: registryItemTypeSchema,
  target: z.string(),
});

export const registryItemSchema = z.object({
  // ------------------------------------------------------------
  // General information about the sdk
  // ------------------------------------------------------------
  $schema: z.string().optional(),
  extends: z.string().optional(),
  title: z.string().optional(),
  author: z.string().min(2).optional(),
  description: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional(),
  docs: z.string().optional(),
  categories: z.array(z.string()).optional(),

  // ------------------------------------------------------------
  // Dependencies
  // ------------------------------------------------------------
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),

  // ------------------------------------------------------------
  // Resource specific fields
  // ------------------------------------------------------------
  name: z.string(), // @acme/sheets, @acme/admin, @acme/client, etc.
  type: registryItemTypeSchema, // We can share sdks, requests collections or individual queries
  files: z.array(registryItemFileSchema).optional(), // Setup for where to find the files to copy into user project
});

export const registrySchema = z.object({
  name: z.string(),
  version: z.string(),
  homepage: z.string(),
  items: z.array(registryItemSchema),
});

export type RegistrySchema = z.infer<typeof registrySchema>;
export type RegistryItemSchema = z.infer<typeof registryItemSchema>;
export type RegistryItemFileSchema = z.infer<typeof registryItemFileSchema>;
export type RegistryItemTypeSchema = z.infer<typeof registryItemTypeSchema>;
