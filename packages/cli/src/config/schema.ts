import { z } from "zod";

export const configSchema = z.object({
  $schema: z.string(),
  aliases: z.object({
    api: z.string(),
  }),
});
