import { useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";

import { addUser, client, type NewUser } from "./api";

type Field = keyof NewUser;

/** Counts the requests that really started in the adapter, so you can see invalid ones never do. */
const useSentCount = () => {
  const [sent, setSent] = useState(0);
  useEffect(() => client.requestManager.events.onRequestStart(() => setSent((count) => count + 1)), []);
  return sent;
};

export const App = () => {
  const { submit, submitting, data, error } = useSubmit(addUser);
  const [blocked, setBlocked] = useState(0);
  const sent = useSentCount();

  // The error type is the request `error` generic plus the global error, so it is narrowed before use.
  const fieldErrors: Partial<Record<Field, string[]>> =
    error instanceof z.ZodError ? z.flattenError(error).fieldErrors : {};
  const otherError = error && !(error instanceof z.ZodError) ? error.message : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // No checks here. The request validates its own payload, for this form and any other caller.
    const response = await submit({
      payload: {
        firstName: String(form.get("firstName")),
        email: String(form.get("email")),
        age: form.get("age") === "" ? Number.NaN : Number(form.get("age")),
      },
    });
    if (response.error instanceof z.ZodError) setBlocked((count) => count + 1);
  };

  const input = (name: Field, label: string, type = "text") => (
    <label>
      {label}
      <input name={name} type={type} aria-invalid={fieldErrors[name] ? true : undefined} />
      {fieldErrors[name] && <small>{fieldErrors[name][0]}</small>}
    </label>
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Payload validation</h1>
        <p>
          The request checks its payload with zod before sending. Submit an invalid form: nothing leaves the browser.
        </p>
      </hgroup>
      <div className="grid-2">
        <article>
          <form onSubmit={handleSubmit} noValidate>
            {input("firstName", "First name")}
            {input("email", "Email", "email")}
            {input("age", "Age", "number")}
            <button type="submit" aria-busy={submitting} disabled={submitting}>
              Create user
            </button>
          </form>
          {otherError && <p className="error">Request failed: {otherError}</p>}
          {data && !error && (
            <p>
              <ins>Created</ins> user #{data.id}: {data.firstName}, {data.email}
            </p>
          )}
        </article>
        <article>
          <h6>Requests</h6>
          <p>
            Stopped by validation: <strong>{blocked}</strong>
          </p>
          <p>
            Sent to the server: <strong>{sent}</strong>
          </p>
        </article>
      </div>
    </main>
  );
};
