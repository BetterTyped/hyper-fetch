import { z } from "zod";

export const zodToTable = (schema: z.ZodType): { name: string; description: string | undefined }[] => {
  if (schema instanceof z.ZodObject) {
    const { shape } = schema;
    return Object.keys(shape).map((key) => {
      const fieldSchema = shape[key];

      return {
        name: key,
        description: fieldSchema.description,
      };
    });
  }
  return [];
};
