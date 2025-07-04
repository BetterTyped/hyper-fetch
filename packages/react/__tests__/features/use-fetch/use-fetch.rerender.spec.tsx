import { useRef } from "react";
import { useDidMount, useDidUpdate } from "@better-hooks/lifecycle";
import { render } from "@testing-library/react";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { useFetch } from "hooks/use-fetch";
import { client, createRequest, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

// TODO fix error logs
const useWillMount = (fn: () => void) => {
  const mounted = useRef(false);

  if (!mounted.current) {
    mounted.current = true;
    fn();
  }
};

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
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    rerenders = 0;
    request = createRequest();
    client.clear();
    mockRequest(request, { delay: fetchTime });
  });

  // FIXES https://github.com/BetterTyped/hyper-fetch/issues/94
  it("should start in loading state", async () => {
    let isLoading = false;

    function Page() {
      const { loading } = useFetch(request);

      useWillMount(() => {
        isLoading = loading;
      });

      rerenders += 1;

      return <div>{loading ? "loading" : "error"}</div>;
    }

    render(<Page />);

    await waitForDoubleFetch();
    await sleep(200);

    expect(isLoading).toBe(true);
    expect(rerenders).toBe(2);
  });

  it("should not rerender when the same data is received from backend", async () => {
    const Page = () => {
      const { data } = useFetch(request, { refresh: false, refreshTime: 0 });

      rerenders += 1;

      return <div>{JSON.stringify(data)}</div>;
    };

    render(<Page />);
    await waitForDoubleFetch();

    expect(rerenders).toBe(2);
  });
  it("should not rerender when changed key is not used", async () => {
    const Page = () => {
      const { setError, setResponseTimestamp } = useFetch(request);

      rerenders += 1;

      useDidMount(() => {
        setResponseTimestamp(new Date());
        setTimeout(() => {
          setError(new Error("test"), true);
        }, fetchTime / 2);
      });

      return <div>test</div>;
    };

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(1);
  });
  it("should rerender when dependency tracking is off", async () => {
    const Page = () => {
      const { data } = useFetch(request, { dependencyTracking: false });

      rerenders += 1;

      return <div>{JSON.stringify(data)}</div>;
    };

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(2);
  });
  it("should rerender while using the changed key", async () => {
    const Page = () => {
      const { data, setData } = useFetch(request);

      rerenders += 1;

      useDidUpdate(() => {
        if (data) {
          setData(null);
        }
      }, [data]);

      return <div>{JSON.stringify(data)}</div>;
    };

    render(<Page />);

    await waitForDoubleFetch();

    expect(rerenders).toBe(3);
  });
});
