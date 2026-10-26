import { act, render, screen } from "@testing-library/react";
import { useCache } from "hooks/use-cache";

import { client, createRequest } from "../../utils";

type Todos = { items: { id: number; done: boolean }[]; total: number };

describe("useCache [ Select ]", () => {
  let request = createRequest<Todos>();

  const setCacheData = (data: Todos) => {
    act(() => {
      client.cache.set(request, {
        data,
        error: null,
        status: 200,
        success: true,
        extra: { headers: {} },
        retries: 0,
        isCanceled: false,
        isOffline: false,
        willRetry: false,
        addedTimestamp: Date.now(),
        triggerTimestamp: Date.now(),
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      });
    });
  };

  beforeEach(() => {
    client.clear();
    request = createRequest<Todos>();
  });

  it("should return the selected cache data", () => {
    setCacheData({ items: [{ id: 1, done: false }], total: 1 });

    function Page() {
      const { data } = useCache(request, { select: (value) => value.total });
      return <div data-testid="result">{JSON.stringify(data)}</div>;
    }

    render(<Page />);

    expect(screen.getByTestId("result").textContent).toBe("1");
  });

  it("should rerender only when the selected value changes", () => {
    setCacheData({ items: [{ id: 1, done: false }], total: 1 });
    let renders = 0;

    function Page() {
      const { data } = useCache(request, { select: (value) => value.items.filter((item) => item.done) });
      renders += 1;
      return <div data-testid="result">{JSON.stringify(data)}</div>;
    }

    render(<Page />);
    expect(renders).toBe(1);

    // New undone item - the filtered result is still an empty list
    setCacheData({
      items: [
        { id: 1, done: false },
        { id: 2, done: false },
      ],
      total: 2,
    });
    expect(renders).toBe(1);

    setCacheData({
      items: [
        { id: 1, done: true },
        { id: 2, done: false },
      ],
      total: 2,
    });
    expect(renders).toBe(2);
    expect(screen.getByTestId("result").textContent).toBe(JSON.stringify([{ id: 1, done: true }]));
  });

  it("should return null without cache data", () => {
    const selectSpy = vi.fn((value: Todos) => value.total);

    function Page() {
      const { data } = useCache(request, { select: selectSpy });
      return <div data-testid="result">{JSON.stringify(data)}</div>;
    }

    render(<Page />);

    expect(screen.getByTestId("result").textContent).toBe("null");
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it("should reset the selected data on clear", () => {
    setCacheData({ items: [], total: 3 });
    let clearState: (() => void) | null = null;

    function Page() {
      const view = useCache(request, { select: (value) => value.total });
      ({ clearState } = view);
      return <div data-testid="result">{JSON.stringify(view.data)}</div>;
    }

    const view = render(<Page />);
    expect(screen.getByTestId("result").textContent).toBe("3");

    act(() => {
      clearState?.();
    });
    view.rerender(<Page />);

    expect(screen.getByTestId("result").textContent).toBe("null");
  });
});
