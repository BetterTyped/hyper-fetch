import { act } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number; name: string };

const user: User = { id: 1, name: "Maciej" };

describe("useFetch [ Hydration ]", () => {
  let request = createRequest<User>();
  let calls = gateRequest(request);
  let container = document.createElement("div");
  let unmount: VoidFunction = () => null;

  const Page = ({ revalidate }: { revalidate?: boolean }) => {
    const { data, loading } = useFetch(request, { revalidate });
    return (
      <div>
        {data?.name ?? "empty"}:{loading ? "loading" : "idle"}
      </div>
    );
  };

  /** Renders the markup like the server does and hydrates it in the browser */
  const hydrate = async (element: React.ReactElement) => {
    container.innerHTML = renderToString(element);
    const serverMarkup = container.textContent;
    await act(async () => {
      const root = hydrateRoot(container, element);
      unmount = () => root.unmount();
    });
    return serverMarkup;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<User>();
    calls = gateRequest(request);
    container = document.createElement("div");
    document.body.append(container);
    vi.spyOn(console, "error").mockImplementation(() => null);
  });

  afterEach(() => {
    act(() => unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("when the cache is hydrated with the server data", () => {
    beforeEach(() => {
      const hydrationData = request.dehydrate({
        response: {
          data: user,
          error: null,
          status: 200,
          success: true,
          extra: client.adapter.defaultExtra,
          requestTimestamp: Date.now(),
          responseTimestamp: Date.now(),
        },
      });
      client.hydrate([hydrationData]);
    });

    it("should render the data without hydration mismatch", async () => {
      const serverMarkup = await hydrate(<Page revalidate={false} />);

      expect(serverMarkup).toBe("Maciej:idle");
      expect(container.textContent).toBe("Maciej:idle");
      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });
    it("should not refetch fresh hydrated data when revalidate is off", async () => {
      await hydrate(<Page revalidate={false} />);
      await advance();

      expect(calls).toHaveLength(0);
    });
    it("should revalidate the hydrated data by default", async () => {
      await hydrate(<Page />);
      await advance();
      expect(calls).toHaveLength(1);
      expect(container.textContent).toBe("Maciej:loading");

      calls[0].succeed({ id: 1, name: "Fresh" });
      await settle();

      expect(container.textContent).toBe("Fresh:idle");
    });
    it("should refetch the hydrated data once it gets stale", async () => {
      client.clear();
      request = createRequest<User>({ staleTime: 1000 });
      calls = gateRequest(request);
      setCacheResponse(request, user, Date.now() - 5000);

      await hydrate(<Page revalidate={false} />);
      await advance();

      expect(calls).toHaveLength(1);
    });
  });

  describe("when there is no data on the server", () => {
    it("should render the loading state and fetch after the hydration", async () => {
      const serverMarkup = await hydrate(<Page />);
      await advance();

      expect(serverMarkup).toBe("empty:loading");
      expect(calls).toHaveLength(1);
      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();

      calls[0].succeed(user);
      await settle();

      expect(container.textContent).toBe("Maciej:idle");
    });
  });
});
