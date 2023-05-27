import { render, screen, waitFor } from "@testing-library/react";

import { useFetch } from "hooks/use-fetch";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { client, createRequest } from "../../utils";

describe("useFetch [ Prefetch ]", () => {
  let request = createRequest<any, undefined>();
  let mock = createRequestInterceptor(request);

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
    client.clear();
    mock = createRequestInterceptor(request);
    request = createRequest();
  });

  describe("when request is triggered while mounting page", () => {
    it("should pre-fetch data", async () => {
      await request.send({});

      createRequestInterceptor(request, { fixture: { wrongData: 123 } });

      function Page() {
        const { data } = useFetch(request, { fetchOnMount: false });
        return <div>{JSON.stringify(data)}</div>;
      }

      render(<Page />);

      await waitFor(async () => {
        const successData = await screen.findByText(JSON.stringify(mock));
        expect(successData).toBeInTheDocument();
      });
    });
    it("should not show error when pre-fetching is failed and fetch again", async () => {
      const errorMock = createRequestInterceptor(request, { status: 400 });

      await request.send({});

      const successMock = createRequestInterceptor(request);

      function Page() {
        const { data } = useFetch(request, { fetchOnMount: false });
        return <div>{JSON.stringify(data)}</div>;
      }

      render(<Page />);

      const errorData = await screen.queryByText(JSON.stringify(errorMock));
      expect(errorData).not.toBeInTheDocument();

      await waitFor(async () => {
        const successData = await screen.findByText(JSON.stringify(successMock));
        expect(successData).toBeInTheDocument();
      });
    });
  });
});
