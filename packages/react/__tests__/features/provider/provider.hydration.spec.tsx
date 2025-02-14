/* eslint-disable react/jsx-fragments */
/* eslint-disable react/jsx-no-useless-fragment */
import { Fragment } from "react";
import { HttpAdapterExtraType, Client } from "@hyper-fetch/core";
import { render, waitFor } from "@testing-library/react";

import { UseFetchRequest, UseFetchReturnType, useFetch } from "hooks/use-fetch";
import { UseSubmitReturnType, useSubmit } from "hooks/use-submit";
import { Provider } from "provider";

describe("Provider [ Hydration ]", () => {
  const data = [1, 2, 3, 4, 5];
  const extra: HttpAdapterExtraType = { headers: { "x-test": "test" } };
  let client = new Client({
    url: "http://localhost:3000",
  });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });

  const hydrate = () => {
    client.hydrate([
      {
        cacheKey: request.cacheKey,
        cache: true,
        cacheTime: Infinity,
        staleTime: 1000,
        timestamp: Date.now(),
        response: {
          data,
          error: null,
          status: 200,
          extra,
          success: true,
          responseTimestamp: Date.now(),
          requestTimestamp: Date.now(),
        },
        hydrated: true,
        override: true,
      },
    ]);
  };

  const Page = () => {
    return <Fragment />;
  };

  const App = ({ children }: { children?: React.ReactNode }) => {
    return (
      <Provider
        config={{
          useFetchConfig: {
            disabled: true,
          },
        }}
      >
        <Page />
        {children}
      </Provider>
    );
  };

  beforeEach(() => {
    client.clear();
    client = new Client({
      url: "http://localhost:3000",
    });
    request = client.createRequest<{ response: any }>()({ endpoint: "/shared-endpoint" });
  });

  describe("given app is rendered on the Server", () => {
    describe("when hydration data is passed down to the Provider", () => {
      it("should hydrate the data for useFetch hook", async () => {
        let useFetchResults: UseFetchReturnType<typeof request> | undefined;

        hydrate();
        const Children = () => {
          useFetchResults = useFetch(request, { revalidate: false, disabled: true });
          return <Fragment />;
        };
        render(
          <App>
            <Children />
          </App>,
          { hydrate: true },
        );

        await waitFor(() => {
          expect(useFetchResults?.data).toStrictEqual(data);
          expect(useFetchResults?.status).toBe(200);
          expect(useFetchResults?.error).toBe(null);
          expect(useFetchResults?.extra).toBe(extra);
          expect(useFetchResults?.success).toBe(true);
        });
      });
      it("should hydrate the data for useSubmit hook", async () => {
        let useSubmitResults: UseSubmitReturnType<typeof request> | undefined;

        hydrate();
        const Children = () => {
          useSubmitResults = useSubmit(request);
          return <Fragment />;
        };
        render(
          <App>
            <Children />
          </App>,
          { hydrate: true },
        );
        await waitFor(() => {
          expect(useSubmitResults?.data).toStrictEqual(data);
          expect(useSubmitResults?.status).toBe(200);
          expect(useSubmitResults?.error).toBe(null);
          expect(useSubmitResults?.extra).toBe(extra);
        });
      });
    });
  });

  describe("given app is rendered on the Client", () => {
    describe("when hydration data is passed down to the Provider", () => {
      it("should hydrate the data for useFetch hook", async () => {
        let useFetchResults: UseFetchReturnType<UseFetchRequest<typeof request>> | undefined;
        hydrate();
        const Children = () => {
          useFetchResults = useFetch(request);
          return <Fragment />;
        };
        render(
          <App>
            <Children />
          </App>,
        );
        await waitFor(() => {
          expect(useFetchResults?.data).toStrictEqual(data);
          expect(useFetchResults?.status).toBe(200);
          expect(useFetchResults?.error).toBe(null);
          expect(useFetchResults?.extra).toBe(extra);
          expect(useFetchResults?.success).toBe(true);
        });
      });
      it("should hydrate the data for useSubmit hook", async () => {
        let useSubmitResults: UseSubmitReturnType<typeof request> | undefined;
        hydrate();
        const Children = () => {
          useSubmitResults = useSubmit(request);
          return <Fragment />;
        };
        render(
          <App>
            <Children />
          </App>,
        );
        await waitFor(() => {
          expect(useSubmitResults?.data).toStrictEqual(data);
          expect(useSubmitResults?.status).toBe(200);
          expect(useSubmitResults?.error).toBe(null);
          expect(useSubmitResults?.extra).toBe(extra);
        });
      });
    });
  });
});
