import { useFetch } from "@hyper-fetch/react";
import type { GraphQLFormattedError } from "graphql";
import { useState } from "react";

import { getCountries, getCountry } from "./api";

const continents = [
  { code: "EU", name: "Europe" },
  { code: "AS", name: "Asia" },
  { code: "AF", name: "Africa" },
  { code: "NA", name: "North America" },
  { code: "SA", name: "South America" },
  { code: "OC", name: "Oceania" },
];

// GraphQL errors are a list. Network and timeout errors use the same shape.
const formatErrors = (errors: GraphQLFormattedError[]) => errors.map((error) => error.message).join(", ");

const CountryDetails = ({ code }: { code: string }) => {
  const { data, error, loading } = useFetch(getCountry.setPayload({ code }));

  if (loading && !data) return <article aria-busy="true">Loading country...</article>;
  if (error) return <article className="error">Could not load the country: {formatErrors(error)}</article>;
  if (!data?.country) return <article>Country not found.</article>;

  const { country } = data;

  return (
    <article>
      <header>
        <h3>
          {country.emoji} {country.name}
        </h3>
        <small className="muted">{country.native}</small>
      </header>
      <dl>
        <dt>Capital</dt>
        <dd>{country.capital ?? "-"}</dd>
        <dt>Currency</dt>
        <dd>{country.currency ?? "-"}</dd>
        <dt>Languages</dt>
        <dd>{country.languages.map((language) => language.name).join(", ") || "-"}</dd>
      </dl>
    </article>
  );
};

export const App = () => {
  const [continent, setContinent] = useState("EU");
  const [selected, setSelected] = useState<string | null>(null);

  // `setPayload` sets the GraphQL variables. Each continent gets its own cache entry.
  const { data, error, loading } = useFetch(getCountries.setPayload({ continent }));

  return (
    <main className="container">
      <hgroup>
        <h1>Countries</h1>
        <p>A GraphQL API with typed queries and variables. Visited continents and countries load from the cache.</p>
      </hgroup>
      <nav className="tabs">
        {continents.map((item) => (
          <button
            key={item.code}
            type="button"
            className={item.code === continent ? undefined : "outline secondary"}
            onClick={() => setContinent(item.code)}
          >
            {item.name}
          </button>
        ))}
      </nav>
      <div className="grid-2">
        <section>
          {loading && !data && <p aria-busy="true">Loading countries...</p>}
          {error && <p className="error">Could not load countries: {formatErrors(error)}</p>}
          <ul className="list">
            {data?.countries.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className={country.code === selected ? undefined : "outline secondary"}
                  onClick={() => setSelected(country.code)}
                >
                  {country.emoji} {country.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
        {selected ? <CountryDetails code={selected} /> : <p className="muted">No country selected.</p>}
      </div>
    </main>
  );
};
