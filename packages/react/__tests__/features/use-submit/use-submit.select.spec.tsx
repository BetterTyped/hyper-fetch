import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";

import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Select ]", () => {
  let request = createRequest<{ user: { id: number; name: string }; token: string }>({ method: "POST" });

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
    vi.resetModules();
    client.clear();
    request = createRequest<{ user: { id: number; name: string }; token: string }>({ method: "POST" });
  });

  it("should select the response data while callbacks and submit get the full response", async () => {
    const mock = mockRequest(request, { data: { user: { id: 1, name: "Maciej" }, token: "secret" } });
    const onSuccess = vi.fn();
    let submit: (() => Promise<any>) | null = null;

    function Page() {
      const view = useSubmit(request, { select: (value) => value.user.name });
      ({ submit } = view);
      view.onSubmitSuccess(({ response }) => onSuccess(response.data));
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    render(<Page />);

    let submitResponse: any;
    await act(async () => {
      submitResponse = await submit?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe(JSON.stringify("Maciej"));
    });
    expect(onSuccess).toHaveBeenCalledWith(mock);
    expect(submitResponse.data).toStrictEqual(mock);
  });
});
