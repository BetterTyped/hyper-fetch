import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useFetch } from "hooks/use-fetch";
import { createRequest, client, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";

describe("useFetch [ Integration ]", () => {
  const queryParams = { page: 1 };

  let request = createRequest();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    request = createRequest();
    client.clear();
  });

  describe("given useFetch is initialized in the component", () => {
    describe("when request is about to change", () => {
      it("should use the latest request when its changed", async () => {
        const btnText = "refresh";

        function Page() {
          const [endpoint, setEndpoint] = useState("");
          const [params, setParams] = useState({});
          const { onRequestStart } = useFetch(request.setQueryParams(params), {
            dependencyTracking: false,
            dependencies: [],
          });

          onRequestStart((event) => {
            setEndpoint(event.request.endpoint);
          });

          const addDependency = () => {
            setParams(queryParams);
          };

          return (
            <>
              <button onClick={addDependency} type="button">
                {btnText}
              </button>
              {endpoint}
            </>
          );
        }

        createRequestInterceptor(request);
        createRequestInterceptor(request.setQueryParams(queryParams));

        render(<Page />);

        await waitForRender(1);
        fireEvent.click(screen.getByText(btnText));

        await waitFor(() => {
          const printedDataElement = screen.getByText(request.setQueryParams(queryParams).endpoint);
          expect(printedDataElement).toBeTruthy();
        });
      });
    });
  });
});
