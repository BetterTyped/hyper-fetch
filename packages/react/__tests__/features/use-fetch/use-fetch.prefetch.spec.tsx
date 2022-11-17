import { render, screen, waitFor } from "@testing-library/react";

import { useFetch } from "hooks/use-fetch";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand } from "../../utils";

describe("useFetch [ Prefetch ]", () => {
  let command = createCommand<any, null>();
  let mock = createRequestInterceptor(command);

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
    builder.clear();
    mock = createRequestInterceptor(command);
    command = createCommand();
  });

  describe("when command is triggered while mounting page", () => {
    it("should pre-fetch data", async () => {
      await command.send();

      createRequestInterceptor(command, { fixture: { wrongData: 123 } });

      function Page() {
        const { data } = useFetch(command, { revalidateOnMount: false });
        return <div>{JSON.stringify(data)}</div>;
      }

      render(<Page />);

      await waitFor(async () => {
        const successData = await screen.findByText(JSON.stringify(mock));
        expect(successData).toBeInTheDocument();
      });
    });
    it("should not show error when pre-fetching is failed and fetch again", async () => {
      const errorMock = createRequestInterceptor(command, { status: 400 });

      await command.send();

      const successMock = createRequestInterceptor(command);

      function Page() {
        const { data } = useFetch(command, { revalidateOnMount: false });
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
