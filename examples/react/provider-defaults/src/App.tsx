import { Provider } from "@hyper-fetch/react";
import type { ProviderOptionsType } from "@hyper-fetch/react";
import { useState } from "react";

import { QuoteWidget, TodoWidget, UserWidget } from "./Widgets";

type Defaults = {
  refresh: boolean;
  refreshTime: number;
  refetchOnFocus: boolean;
};

export const App = () => {
  const [defaults, setDefaults] = useState<Defaults>({
    refresh: true,
    refreshTime: 5000,
    refetchOnFocus: true,
  });

  // Every useFetch below starts from these options. A hook's own options win, one option at a time.
  const config: ProviderOptionsType = { useFetchConfig: defaults };

  const change = <K extends keyof Defaults>(key: K, value: Defaults[K]) =>
    setDefaults((current) => ({ ...current, [key]: value }));

  return (
    <Provider config={config}>
      <main className="container">
        <hgroup>
          <h1>Provider defaults</h1>
          <p>Hook options set once for the whole app. Each widget uses them or overrides some of them.</p>
        </hgroup>

        <article>
          <header>
            <strong>Provider config</strong>
          </header>
          <div className="grid-3">
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={defaults.refresh}
                onChange={(event) => change("refresh", event.target.checked)}
              />
              refresh
            </label>
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={defaults.refetchOnFocus}
                onChange={(event) => change("refetchOnFocus", event.target.checked)}
              />
              refetchOnFocus
            </label>
            <select
              aria-label="refreshTime"
              value={defaults.refreshTime}
              onChange={(event) => change("refreshTime", Number(event.target.value))}
            >
              {[3000, 5000, 10000].map((time) => (
                <option key={time} value={time}>
                  refreshTime: {time / 1000}s
                </option>
              ))}
            </select>
          </div>
          <pre>
            <code>{JSON.stringify(config, null, 2)}</code>
          </pre>
        </article>

        <div className="grid-3">
          <QuoteWidget />
          <TodoWidget />
          <UserWidget />
        </div>
      </main>
    </Provider>
  );
};
