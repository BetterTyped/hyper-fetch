import { act, render, screen, waitFor } from "@testing-library/react";

import { Provider, ProviderValueType, useProvider } from "provider";

describe("useProvider [ Base ]", () => {
  const text = "test";
  let values: ProviderValueType | undefined;

  const Page = () => {
    values = useProvider();
    return <div>{text}</div>;
  };
  const App = () => {
    return (
      <Provider>
        <Page />
      </Provider>
    );
  };

  beforeEach(() => {
    values = undefined;
  });

  describe("given app is wrapped with Provider", () => {
    describe("when configuration values are passed to the provider", () => {
      it("should receive configuration with hook", async () => {
        render(<App />);
        await waitFor(() => {
          expect(values).toBeDefined();
        });
      });
      it("should allow to modify received values", async () => {
        const customConfig = { useFetchConfig: { bounceTime: 99999 } };
        render(<App />);

        act(() => {
          values?.setConfig(customConfig);
        });

        await waitFor(() => {
          expect(values?.config).toStrictEqual(customConfig);
        });
      });
    });
  });

  describe("given app is not wrapped with provider", () => {
    describe("when app gets rendered", () => {
      it("should allow to render", async () => {
        render(<Page />);
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      it("should have default setConfig that does nothing", async () => {
        render(<Page />);

        act(() => {
          values?.setConfig({ useCacheConfig: { dependencyTracking: false } });
        });

        await waitFor(() => {
          expect(values?.config).toStrictEqual({});
        });
      });
    });
  });
});
