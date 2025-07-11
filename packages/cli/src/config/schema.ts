import { z } from "zod";

export const configSchema = z.object({
  tsx: z.boolean(),
  aliases: z.object({
    api: z.string(),
    hooks: z.string(),
    ui: z.string(),
    components: z.string(),
    lib: z.string(),
  }),
  resolvedPaths: z.object({
    cwd: z.string(),
    api: z.string(),
    hooks: z.string(),
    ui: z.string(),
    components: z.string(),
    lib: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;
