import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";
import type { GraphQLFormattedError } from "graphql";

/** The adapter sends every request as a GraphQL operation. Errors come back as the GraphQL `errors` list. */
export const client = createClient<{ error: GraphQLFormattedError[] }>({
  url: "https://countries.trevorblades.com/",
}).setAdapter(GraphqlAdapter());

export type CountrySummary = { code: string; name: string; emoji: string };
export type Country = CountrySummary & {
  native: string;
  capital: string | null;
  currency: string | null;
  languages: { name: string }[];
};

/**
 * The GraphQL document goes in `endpoint` (a string or a `gql` document) and the payload holds the variables.
 * The variables are a part of the cache key, so every continent is cached on its own.
 */
export const getCountries = client.createRequest<{
  response: { countries: CountrySummary[] };
  payload: { continent: string };
}>()({
  endpoint: /* GraphQL */ `
    query Countries($continent: String!) {
      countries(filter: { continent: { eq: $continent } }) {
        code
        name
        emoji
      }
    }
  `,
});

export const getCountry = client.createRequest<{
  response: { country: Country | null };
  payload: { code: string };
}>()({
  endpoint: /* GraphQL */ `
    query Country($code: ID!) {
      country(code: $code) {
        code
        name
        native
        emoji
        capital
        currency
        languages {
          name
        }
      }
    }
  `,
});
