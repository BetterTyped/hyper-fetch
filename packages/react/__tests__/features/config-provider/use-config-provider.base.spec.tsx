import { act, render, screen, waitFor } from "@testing-library/react";

import { ConfigProvider, ConfigProviderValueType, useConfigProvider } from "config-provider";

describe("useConfigProvider [ Base ]", () => {
  const text = "test";
  let values: ConfigProviderValueType | undefined;

  function Page() {
    values = useConfigProvider();
    return <div>{text}</div>;
  }
  function App() {
    return (
      <ConfigProvider>
        <Page />
      </ConfigProvider>
    );
  }

  beforeEach(() => {
    values = undefined;
  });

  describe("given app is wrapped with ConfigProvider", () => {
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
          values?.[1](customConfig);
        });

        await waitFor(() => {
          expect(values?.[0]).toStrictEqual(customConfig);
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
    });
  });
});
