import { oc } from "@orpc/contract";
import { z } from "zod";

const planetType = z.enum(["rocky", "gas", "ice"]);

const planet = z.object({
  id: z.number(),
  name: z.string(),
  type: planetType,
  // A real `Date` on both sides: the oRPC serializer keeps the type, unlike plain JSON.
  discoveredAt: z.date(),
});

export type Planet = z.infer<typeof planet>;

/** The API shape, written before any implementation. The server implements it, the client reads its type. */
export const contract = {
  planet: {
    list: oc.output(z.array(planet)),
    create: oc
      .input(
        z.object({
          name: z.string().trim().min(2),
          type: planetType,
          discoveredAt: z.date(),
        }),
      )
      .output(planet)
      // Defined errors keep their code and data type on the client.
      .errors({
        CONFLICT: {
          message: "This planet already exists",
          data: z.object({ name: z.string() }),
        },
      }),
  },
};
