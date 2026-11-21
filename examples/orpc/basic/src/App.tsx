import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { sdk } from "./api";

const types = ["rocky", "gas", "ice"] as const;

export const App = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("ice");
  const [date, setDate] = useState("1930-02-18");

  const { data, error, loading, refetch } = useFetch(sdk.planet.list.$query);
  const { submit, submitting, error: createError, onSubmitSuccess } = useSubmit(sdk.planet.create.$mutation);

  onSubmitSuccess(() => {
    setName("");
    refetch();
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // `discoveredAt` is a Date. The adapter encodes it with the oRPC serializer.
    submit({ payload: { name, type, discoveredAt: new Date(date) } });
  };

  // Network failures are plain `Error`s. For procedure errors, `defined` and `code` narrow `data` to the contract type.
  const isProcedureError = createError && "defined" in createError;
  const conflict =
    isProcedureError && createError.defined && createError.code === "CONFLICT" ? createError.data.name : null;

  return (
    <main className="container">
      <hgroup>
        <h1>oRPC planets</h1>
        <p>A contract-first oRPC API on Hono, called through HyperFetch with types from the contract.</p>
      </hgroup>
      <form onSubmit={handleSubmit}>
        <fieldset className="grid">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name, e.g. Pluto" />
          <select
            value={type}
            onChange={(event) => setType(types.find((item) => item === event.target.value) ?? "rocky")}
          >
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <button type="submit" aria-busy={submitting} disabled={submitting}>
            Add planet
          </button>
        </fieldset>
        {conflict && <small className="error">{conflict} is already on the list.</small>}
        {createError && !conflict && <small className="error">{createError.message}</small>}
      </form>
      {loading && !data && <p aria-busy="true">Loading planets...</p>}
      {error && <p className="error">Could not load planets: {error.message}</p>}
      <table>
        <thead>
          <tr>
            <th>Planet</th>
            <th>Type</th>
            <th>Discovered</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((planet) => (
            <tr key={planet.id}>
              <td>{planet.name}</td>
              <td>{planet.type}</td>
              {/* No parsing: `discoveredAt` arrives as a Date. */}
              <td>
                {planet.discoveredAt.toLocaleDateString(undefined, {
                  dateStyle: "long",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};
