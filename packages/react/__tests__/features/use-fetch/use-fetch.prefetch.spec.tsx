import { render, screen, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { useFetch } from "hooks/use-fetch";
import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Prefetch ]", () => {
  let request = createRequest<any, undefined>();
  let mock = mockRequest(request);

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
    client.clear();
    mock = mockRequest(request);
    request = createRequest();
  });

  describe("when request is triggered while mounting page", () => {
    it("should pre-fetch data", async () => {
      await request.send({});

      mockRequest(request, { data: { wrongData: 123 } });

      const Page = () => {
        const { data } = useFetch(request, { revalidate: false });
        return <div>{JSON.stringify(data)}</div>;
      };

      render(<Page />);

      await waitFor(async () => {
        const successData = await screen.findByText(JSON.stringify(mock));
        expect(successData).toBeInTheDocument();
      });
    });
    it("should not show error when pre-fetching is failed and fetch again", async () => {
      const errorMock = mockRequest(request, { status: 400 });

      await request.send({});

      const successMock = mockRequest(request);

      const Page = () => {
        const { data } = useFetch(request, { revalidate: false });
        return <div>{JSON.stringify(data)}</div>;
      };

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
