import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import type { Components } from "./api/petstore.sdk";
import { client, sdk } from "./client";

// Models from the spec are exported by the generated file too.
type Status = NonNullable<Components.Schemas.Pet["status"]>;
const statuses: Status[] = ["available", "pending", "sold"];

const PetDetails = ({ petId }: { petId: number }) => {
  // `:petId` in the spec path types `setParams()`.
  const { data, error, loading } = useFetch(sdk.pet.$petId.$get.setParams({ petId }));

  if (loading && !data) return <p aria-busy="true">Loading pet {petId}...</p>;
  if (error || !data) return <p className="error">Pet {petId} was not found.</p>;
  return (
    <p>
      <strong>{data.name}</strong> <mark>{data.status}</mark> {data.category?.name}
      <br />
      <small className="muted">GET /pet/{petId}</small>
    </p>
  );
};

export const App = () => {
  const [status, setStatus] = useState<Status>("available");
  const [petId, setPetId] = useState<number | null>(null);
  const [name, setName] = useState("");

  // `status` is a required query param in the spec, so leaving it out does not compile.
  const pets = useFetch(sdk.pet.findByStatus.$get.setQueryParams({ status }));
  const { submit, submitting, error: createError, onSubmitSuccess } = useSubmit(sdk.pet.$post);

  onSubmitSuccess(({ response }) => {
    setName("");
    setPetId(response.data.id ?? null);
    client.cache.invalidate(/findByStatus/);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The `Pet` schema types the payload: `name` and `photoUrls` are required.
    submit({
      payload: {
        id: Date.now() % 1_000_000,
        name,
        photoUrls: [],
        status: "available",
      },
    });
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Pet store</h1>
        <p>Requests generated from the Swagger Petstore OpenAPI spec by @hyper-fetch/cli.</p>
      </hgroup>
      <div className="grid-2">
        <article>
          <header>Add a pet</header>
          <form onSubmit={handleSubmit}>
            <fieldset role="group">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
              <button type="submit" aria-busy={submitting} disabled={submitting}>
                Add
              </button>
            </fieldset>
            {createError && <small className="error">Could not add the pet.</small>}
          </form>
          {petId === null ? (
            <p className="muted">Add a pet or pick an id from the list.</p>
          ) : (
            <PetDetails petId={petId} />
          )}
        </article>
        <section>
          <div role="group">
            {statuses.map((item) => (
              <button
                key={item}
                type="button"
                className={item === status ? undefined : "outline"}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {pets.loading && !pets.data && <p aria-busy="true">Loading pets...</p>}
          {pets.error && <p className="error">Could not load pets.</p>}
          <ul className="list">
            {pets.data?.slice(0, 12).map((pet) => (
              <li key={pet.id}>
                <span>{pet.name}</span>
                {/* The shared demo data has ids too large for a JavaScript number, those can't be looked up. */}
                {pet.id !== undefined && Number.isSafeInteger(pet.id) && (
                  <button type="button" className="outline secondary" onClick={() => setPetId(pet.id ?? null)}>
                    #{pet.id}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
};
