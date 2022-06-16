import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useFetch } from "use-fetch";
import { createCommand, builder, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";

describe("useFetch [ Integration ]", () => {
  const queryParams = { page: 1 };

  let command = createCommand();

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
    command = createCommand();
    builder.clear();
  });

  describe("given useFetch is initialized in the component", () => {
    describe("when command is about to change", () => {
      it("should use the latest command when its changed", async () => {
        const btnText = "refresh";

        function Page() {
          const [endpoint, setEndpoint] = useState("");
          const [params, setParams] = useState({});
          const { onRequestStart } = useFetch(command.setQueryParams(params), {
            dependencyTracking: false,
            dependencies: [],
          });

          onRequestStart((event) => {
            setEndpoint(event.command.endpoint);
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

        createRequestInterceptor(command);
        createRequestInterceptor(command.setQueryParams(queryParams));

        render(<Page />);

        await waitForRender(1);
        fireEvent.click(screen.getByText(btnText));

        await waitFor(() => {
          const printedDataElement = screen.getByText(command.setQueryParams(queryParams).endpoint);
          expect(printedDataElement).toBeTruthy();
        });
      });
    });
  });
});
