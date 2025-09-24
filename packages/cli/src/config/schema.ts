import { z } from "zod";

export const registryConfigItemSchema = z.union([
  // Simple string format: "https://example.com/{name}.json"
  z.string().refine((s) => s.includes("{name}"), {
    message: "Registry URL must include {name} placeholder",
  }),
  // Advanced object format with auth options
  z.object({
    url: z.string().refine((s) => s.includes("{name}"), {
      message: "Registry URL must include {name} placeholder",
    }),
    params: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
]);

export const registryConfigSchema = z.record(
  z.string().refine((key) => key.startsWith("@"), {
    message: "Registry names must start with @ (e.g., @v0, @acme)",
  }),
  registryConfigItemSchema,
);

export const configSchema = z.object({
  $schema: z.string(),
  tsx: z.boolean(),
  rsc: z.boolean(),
  aliases: z.object({
    api: z.string(),
    hooks: z.string(),
    ui: z.string(),
    components: z.string(),
    lib: z.string(),
    utils: z.string(),
  }),
  registries: registryConfigSchema.optional(),
  resolvedPaths: z.object({
    cwd: z.string(),
    api: z.string(),
    hooks: z.string(),
    ui: z.string(),
    components: z.string(),
    lib: z.string(),
    utils: z.string(),
  }),
});

export const rawConfigSchema = configSchema.omit({ resolvedPaths: true });

export type Config = z.infer<typeof configSchema>;
