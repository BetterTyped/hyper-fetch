import { createClient } from "@hyper-fetch/core";
import { z } from "zod";

export const client = createClient({ url: "https://dummyjson.com" });

/** One schema for the payload: the type and the rules come from the same place. */
export const NewUserSchema = z.object({
  firstName: z.string().trim().min(2, "At least 2 characters"),
  email: z.email("Not a valid email"),
  age: z.number("Enter a number").int("Whole years only").min(18, "Must be 18 or older").max(120, "Too old to be true"),
});

export type NewUser = z.infer<typeof NewUserSchema>;
export type User = NewUser & { id: number };

export const addUser = client
  .createRequest<{ response: User; payload: NewUser; error: z.ZodError<NewUser> }>()({
    endpoint: "/users/add",
    method: "POST",
  })
  // Runs in the adapter before anything is sent. A throw ends the request with that error as `error`,
  // and the fetch never starts. The parsed (trimmed) payload is what goes to the server.
  .setRequestMapper((request) => request.setPayload(NewUserSchema.parse(request.payload)));
