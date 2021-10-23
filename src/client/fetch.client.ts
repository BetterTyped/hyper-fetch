import { FetchMiddleware } from "../middleware/fetch.middleware";
import { ClientResponseType } from "./fetch.client.types";

// Todo: Interceptors

export const fetchClient = ({
  endpoint,
  headers,
  builderConfig,
}: FetchMiddleware<any, any, any, any, any, any, any>) => {
  return new Promise<ClientResponseType<any, any>>((resolve) => {
    return fetch({
      ...builderConfig.httpClientOptions,
      headers: { ...builderConfig.getAdditionalHeaders(), ...headers },
      url: builderConfig.baseUrl + endpoint,
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          return resolve([data, null, response.status]);
        } else {
          return Promise.reject(response);
        }
      })
      .catch((response) => {
        return resolve([null, response.error, response.status]);
      });
  });
};
