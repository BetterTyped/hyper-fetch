import { act, render, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import type { ProviderOptionsType, ProviderValueType } from "provider";
import { Provider, useProvider } from "provider";
import type { ReactNode } from "react";
import { memo } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest } from "../../utils/gate.utils";

describe("Provider [ Config ]", () => {
  let values: ProviderValueType | undefined;
  let consumerRenders = 0;

  const Consumer = memo(() => {
    values = useProvider();
    consumerRenders += 1;
    return null;
  });

  const App = ({ config }: { config?: ProviderOptionsType }) => (
    <Provider config={config}>
      <Consumer />
    </Provider>
  );

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    values = undefined;
    consumerRenders = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the config prop is passed", () => {
    it("should expose the config", () => {
      render(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      expect(values?.config).toStrictEqual({ useFetchConfig: { bounceTime: 1 } });
    });
    it("should expose an empty config without the prop", () => {
      render(<App />);

      expect(values?.config).toStrictEqual({});
    });
    it("should follow the changes of the config prop", () => {
      const view = render(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      view.rerender(<App config={{ useFetchConfig: { bounceTime: 2 } }} />);

      expect(values?.config).toStrictEqual({ useFetchConfig: { bounceTime: 2 } });
    });
    it("should reset the config when the prop gets removed", () => {
      const view = render(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      view.rerender(<App />);

      expect(values?.config).toStrictEqual({});
    });
    it("should not rerender consumers when an equal inline config is passed again", () => {
      const view = render(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);
      const { config } = values as ProviderValueType;

      view.rerender(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);
      view.rerender(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      expect(values?.config).toBe(config);
      expect(consumerRenders).toBe(1);
    });
    it("should keep the config set with setConfig while the prop stays the same", () => {
      const view = render(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      act(() => {
        values?.setConfig({ useFetchConfig: { bounceTime: 50 } });
      });
      view.rerender(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      expect(values?.config).toStrictEqual({ useFetchConfig: { bounceTime: 50 } });
    });
    it("should replace the config set with setConfig when the prop changes", () => {
      const view = render(<App config={{ useFetchConfig: { bounceTime: 1 } }} />);

      act(() => {
        values?.setConfig({ useFetchConfig: { bounceTime: 50 } });
      });
      view.rerender(<App config={{ useFetchConfig: { bounceTime: 2 } }} />);

      expect(values?.config).toStrictEqual({ useFetchConfig: { bounceTime: 2 } });
    });
  });

  describe("when hooks read the config", () => {
    const createWrapper = (config: ProviderOptionsType) => {
      return ({ children }: { children: ReactNode }) => <Provider config={config}>{children}</Provider>;
    };

    it("should apply the useFetch config to the hook", async () => {
      const request = createRequest();
      const calls = gateRequest(request);
      const { result } = renderHook(() => useFetch(request).loading, {
        wrapper: createWrapper({ useFetchConfig: { disabled: true } }),
      });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current).toBeFalse();
    });
    it("should prefer the hook options over the config", async () => {
      const request = createRequest();
      const calls = gateRequest(request);
      renderHook(() => useFetch(request, { disabled: false }).loading, {
        wrapper: createWrapper({ useFetchConfig: { disabled: true } }),
      });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should use the default options without the provider", async () => {
      const request = createRequest();
      const calls = gateRequest(request);
      renderHook(() => useFetch(request).loading);
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should apply the config changed with the prop to the mounted hook", async () => {
      const request = createRequest();
      const calls = gateRequest(request);
      const Page = () => {
        const { loading } = useFetch(request);
        return <div>{String(loading)}</div>;
      };
      const view = render(
        <Provider config={{ useFetchConfig: { disabled: true } }}>
          <Page />
        </Provider>,
      );
      await advance();
      expect(calls).toHaveLength(0);

      view.rerender(
        <Provider config={{ useFetchConfig: { disabled: false } }}>
          <Page />
        </Provider>,
      );
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should use the closest provider", async () => {
      const request = createRequest();
      const calls = gateRequest(request);
      const Page = () => {
        const { loading } = useFetch(request);
        return <div>{String(loading)}</div>;
      };
      render(
        <Provider config={{ useFetchConfig: { disabled: false } }}>
          <Provider config={{ useFetchConfig: { disabled: true } }}>
            <Page />
          </Provider>
        </Provider>,
      );
      await advance();

      expect(calls).toHaveLength(0);
    });
  });
});
