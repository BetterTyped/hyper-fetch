import { os, withEventMeta } from "@orpc/server";
import { z } from "zod";

const stages = ["Installing", "Compiling", "Testing", "Bundling", "Uploading", "Warming up"];

// In memory, so the jobs reset when the dev server restarts.
const jobs = new Map<string, { steps: number }>();
let nextId = 1;

/** Waits between steps, and stops early when the client leaves and oRPC aborts the signal. */
const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });

export const router = {
  job: {
    start: os.input(z.object({ steps: z.number().int().min(3).max(12) })).handler(({ input }) => {
      const id = `job-${nextId++}`;
      jobs.set(id, { steps: input.steps });
      return { id, steps: input.steps };
    }),
    // An async generator makes this an event iterator procedure: every `yield` is one event on the stream.
    onProgress: os
      .input(z.object({ id: z.string() }))
      .errors({
        NOT_FOUND: {
          message: "Unknown job",
          data: z.object({ id: z.string() }),
        },
      })
      .handler(async function* ({ input, errors, lastEventId, signal }) {
        const job = jobs.get(input.id);
        if (!job) throw errors.NOT_FOUND({ data: { id: input.id } });

        // After a reconnect the adapter sends the last event id, so the job continues instead of starting over.
        for (let step = Number(lastEventId ?? 0) + 1; step <= job.steps && !signal?.aborted; step++) {
          await wait(700, signal);
          const event = {
            step,
            of: job.steps,
            stage: stages[(step - 1) % stages.length],
            at: new Date(),
          };
          yield withEventMeta(event, { id: String(step) });
        }
        // Returning ends the stream, and listeners see the subscription as ended.
      }),
  },
};
