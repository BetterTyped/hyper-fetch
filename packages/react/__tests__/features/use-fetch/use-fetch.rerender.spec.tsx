import { useDidMount, useDidUpdate } from "@better-hooks/lifecycle";
import { render } from "@testing-library/react";

import { useFetch } from "hooks/use-fetch";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { client, createRequest, sleep, waitForRender } from "../../utils";

describe("useFetch [ Rerender ]", () => {
  let rerenders = 0;
  let request = createRequest();

  const fetchTime = 20;
  const waitForDoubleFetch = async () => {
    await waitForRender();
    await sleep(fetchTime);
    await waitForRender(fetchTime);
    await sleep(fetchTime);
    await waitForRender(fetchTime);
  };

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
    rerenders = 0;
    request = createRequest();
    client.clear();
    createRequestInterceptor(request, { delay: fetchTime });
  });

  it("should not rerender when the same data is received from backend", async () => {
    function Page() {
      const { data } = useFetch(request, { refresh: true, refreshTime: 10 });

      rerenders += 1;

      return <div>{JSON.stringify(data)}</div>;
    }

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(2);
  });
  it("should not rerender when changed key is not used", async () => {
    function Page() {
      const { setError, setTimestamp } = useFetch(request);

      rerenders += 1;

      useDidMount(() => {
        setTimestamp(new Date());
        setTimeout(() => {
          setError(new Error("test"), true);
        }, fetchTime / 2);
      });

      return <div>test</div>;
    }

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(1);
  });
  it("should rerender when dependency tracking is off", async () => {
    function Page() {
      const { data } = useFetch(request, { dependencyTracking: false });

      rerenders += 1;

      return <div>{JSON.stringify(data)}</div>;
    }

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(3);
  });
  it("should rerender while using the changed key", async () => {
    function Page() {
      const { data, setData } = useFetch(request);

      rerenders += 1;

      useDidUpdate(() => {
        if (data) {
          setData(null);
        }
      }, [data]);

      return <div>{JSON.stringify(data)}</div>;
    }

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(3);
  });
});
