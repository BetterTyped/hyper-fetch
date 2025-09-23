import { z } from "zod";

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
  registries: z
    .record(
      z.string(),
      z.object({
        url: z.url(),
        headers: z.record(z.string(), z.string()).optional(),
        queryParams: z.record(z.string(), z.string()).optional(),
      }),
    )
    .optional(),
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
