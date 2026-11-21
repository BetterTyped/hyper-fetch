import { TimeoutError } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type ReactNode, useState } from "react";

import { getProduct, login, reserve } from "./api";

/** The global error branch, the same for every request: HyperFetch's own `Error` objects. */
const TransportError = ({ error }: { error: Error }) => (
  <p className="error">
    {error instanceof TimeoutError ? "The server took too long." : "No connection to the server."}{" "}
    <small>({error.name})</small>
  </p>
);

const Panel = ({ title, type, children }: { title: string; type: string; children: ReactNode }) => (
  <article>
    <header>
      <strong>{title}</strong>
      <br />
      <code>error: {type}</code>
    </header>
    {children}
  </article>
);

const Product = ({ broken }: { broken: boolean }) => {
  const [productId, setProductId] = useState(1);
  const request = getProduct.setParams({ productId });
  const { data, error, loading } = useFetch(broken ? request.setOptions({ timeout: 1 }) : request, {
    dependencies: [broken],
  });

  return (
    <Panel title="Product" type="NotFoundError | Error">
      <div role="group">
        <button type="button" className="outline" onClick={() => setProductId(1)}>
          #1
        </button>
        <button type="button" className="outline" onClick={() => setProductId(9999)}>
          #9999
        </button>
      </div>
      {loading && <p aria-busy="true">Loading...</p>}
      {/* `instanceof Error` splits the global error from the endpoint error. Each branch is fully typed. */}
      {!loading && error instanceof Error && <TransportError error={error} />}
      {!loading && error && !(error instanceof Error) && <p className="error">Not found: {error.message}</p>}
      {!loading && !error && data && (
        <p>
          {data.title} <ins>${data.price}</ins>
        </p>
      )}
    </Panel>
  );
};

const Login = ({ broken }: { broken: boolean }) => {
  const { submit, submitting, data, error } = useSubmit(broken ? login.setOptions({ timeout: 1 }) : login);

  return (
    <Panel title="Login" type="InvalidCredentialsError | Error">
      <div role="group">
        <button
          type="button"
          className="outline"
          onClick={() => submit({ payload: { username: "emilys", password: "wrong" } })}
        >
          Wrong password
        </button>
        <button
          type="button"
          className="outline"
          onClick={() => submit({ payload: { username: "emilys", password: "emilyspass" } })}
        >
          Right password
        </button>
      </div>
      {submitting && <p aria-busy="true">Signing in...</p>}
      {!submitting && error instanceof Error && <TransportError error={error} />}
      {!submitting && error && !(error instanceof Error) && <p className="error">Check your username and password.</p>}
      {!submitting && !error && data && <p>Welcome, {data.firstName}.</p>}
    </Panel>
  );
};

const Reservation = ({ broken }: { broken: boolean }) => {
  const { submit, submitting, data, error } = useSubmit(broken ? reserve.setOptions({ timeout: 1 }) : reserve);

  return (
    <Panel title="Reservation" type="ProblemDetails | Error">
      <div role="group">
        <button
          type="button"
          className="outline"
          onClick={() => submit({ params: { status: 409, message: "No items left" } })}
        >
          Sold out
        </button>
        <button
          type="button"
          className="outline"
          onClick={() => submit({ params: { status: 200, message: "Reserved" } })}
        >
          In stock
        </button>
      </div>
      {submitting && <p aria-busy="true">Reserving...</p>}
      {!submitting && error instanceof Error && <TransportError error={error} />}
      {/* Problem details carry their own status and title, so the branch can go one level deeper. */}
      {!submitting && error && !(error instanceof Error) && (
        <p className="error">
          {error.status === 409 ? "Sold out" : error.title}: {error.detail}
        </p>
      )}
      {!submitting && !error && data && <p>{data.message}</p>}
    </Panel>
  );
};

export const App = () => {
  const [broken, setBroken] = useState(false);

  return (
    <main className="container">
      <hgroup>
        <h1>Typed errors</h1>
        <p>
          Every endpoint fails in its own way. The error type says how, and the UI narrows it before showing a message.
        </p>
      </hgroup>
      <label>
        <input type="checkbox" role="switch" checked={broken} onChange={(event) => setBroken(event.target.checked)} />
        Break the network (1 ms timeout)
      </label>
      <div className="grid-3">
        <Product broken={broken} />
        <Login broken={broken} />
        <Reservation broken={broken} />
      </div>
    </main>
  );
};
