import { useState, StrictMode } from "react";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useFetch } from "hooks/use-fetch";
import { createRequest, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Integration ]", () => {
  const queryParams = { page: 1 };
  const btnText = "refresh";
  const depBtnText = "add dependency";

  let request = createRequest({ endpoint: `/users/${Date.now()}` });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    request = createRequest({ endpoint: `/users/${Date.now()}` });
    request.client.clear();
  });

  describe("given useFetch is initialized in the component", () => {
    describe("when request is about to change", () => {
      it("should use the latest request when its changed", async () => {
        const Page = () => {
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
        };

        mockRequest(request);
        mockRequest(request.setQueryParams(queryParams));

        render(<Page />);

        await waitForRender(1);
        fireEvent.click(screen.getByText(btnText));

        await waitFor(() => {
          const printedDataElement = screen.getByText(request.setQueryParams(queryParams).endpoint);
          expect(printedDataElement).toBeTruthy();
        });
      });
      it("should fetch once in StrictMode", async () => {
        const spy = jest.fn();

        const Page = () => {
          const { data, onFinished } = useFetch(request, {
            dependencyTracking: false,
            refresh: false,
          });

          onFinished(() => {
            spy();
          });

          return <div>{JSON.stringify(data)}</div>;
        };

        mockRequest(request);
        mockRequest(request.setQueryParams(queryParams));

        render(
          <StrictMode>
            <Page />
          </StrictMode>,
        );

        await waitForRender(100);

        await waitFor(() => {
          expect(spy).toHaveBeenCalledOnce();
        });
      });
      it("should fetch sequence in StrictMode", async () => {
        const spy = jest.fn();

        const Page = () => {
          const [params, setParams] = useState({});
          const [dep, setDep] = useState({});
          const { data, onFinished } = useFetch(request.setQueryParams(params), {
            dependencies: [dep],
            dependencyTracking: false,
            refresh: false,
          });

          onFinished(() => {
            spy();
          });

          const addDependency = () => {
            setDep({ test: 1 });
          };

          const addParam = () => {
            setParams(queryParams);
          };

          return (
            <div>
              {JSON.stringify(data)}
              <button onClick={addDependency} type="button">
                {depBtnText}
              </button>
              <button onClick={addParam} type="button">
                {btnText}
              </button>
            </div>
          );
        };

        mockRequest(request);
        mockRequest(request.setQueryParams(queryParams));

        render(
          <StrictMode>
            <Page />
          </StrictMode>,
        );

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(1);
        });

        fireEvent.click(screen.getByText(depBtnText));

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(2);
        });

        fireEvent.click(screen.getByText(btnText));

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(3);
        });
      });
    });
  });
});
