import { useSubmit } from "@hyper-fetch/react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { createPostRequest } from "./api";
import type { NewPost } from "./api";

/** Turns the form fields into the typed payload. An empty author is left out, so the server can reject it. */
const readPayload = (form: HTMLFormElement): NewPost => {
  const fields = new FormData(form);
  const userId = String(fields.get("userId") ?? "");

  return {
    title: String(fields.get("title") ?? ""),
    body: String(fields.get("body") ?? ""),
    ...(userId ? { userId: Number(userId) } : {}),
  };
};

export const App = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // `submitting` and `error` describe the latest submission. Nothing is sent until `submit()` is called.
  const { submit, submitting, error, onSubmitSuccess, onSubmitError } = useSubmit(createPostRequest);

  // Side effects belong in the lifecycle callbacks, not in the submit handler.
  onSubmitSuccess(({ response }) => {
    setNotice({
      ok: true,
      text: `Created post #${response.data.id}: "${response.data.title}"`,
    });
    formRef.current?.reset();
  });

  onSubmitError(({ response }) => {
    setNotice({
      ok: false,
      text: `The server answered ${response.status}. Fix the form and send it again.`,
    });
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    submit({ payload: readPayload(event.currentTarget) });
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>New post</h1>
        <p>Leave the author empty, or pick the one that does not exist, to see the server reject the form.</p>
      </hgroup>

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* A disabled fieldset blocks every field while the request is in flight. */}
        <fieldset disabled={submitting}>
          <label>
            Title
            <input name="title" required minLength={3} placeholder="My first post" />
          </label>
          <label>
            Body
            <textarea name="body" rows={4} placeholder="What is on your mind?" />
          </label>
          <label>
            Author
            <select name="userId" defaultValue="" aria-invalid={error ? true : undefined}>
              <option value="">No author</option>
              <option value="1">Emily Johnson (id 1)</option>
              <option value="2">Michael Williams (id 2)</option>
              <option value="99999">Unknown user (id 99999)</option>
            </select>
            {error && <small>{error.message}</small>}
          </label>
        </fieldset>
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          {submitting ? "Saving..." : "Create post"}
        </button>
      </form>

      {notice && <p role="status">{notice.ok ? <mark>{notice.text}</mark> : notice.text}</p>}
    </main>
  );
};
