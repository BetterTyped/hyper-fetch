import { useState } from "react";

import { type Attempt, getQuote, type Quote, type Scenario, scenarios, startScenario, withBackoff } from "./api";

const describe = ({ status, willRetry, delay }: Attempt) => {
  if (status === 200) return <ins>success</ins>;
  if (willRetry) return `retry in ${delay} ms`;
  if (status !== null && status >= 400 && status < 500) return <mark>not retried, a 4xx will not change</mark>;
  return <mark>gave up, no retries left</mark>;
};

export const App = () => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ quote?: Quote; error?: string; ms: number }>();

  const run = async (scenario: Scenario) => {
    startScenario(scenario);
    setAttempts([]);
    setResult(undefined);
    setLoading(true);
    const startedAt = performance.now();

    const { data, error } = await withBackoff(() => getQuote.send(), {
      onAttempt: (attempt) => setAttempts((prev) => [...prev, attempt]),
    });

    setLoading(false);
    setResult({ quote: data ?? undefined, error: error?.message, ms: Math.round(performance.now() - startedAt) });
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Custom retry</h1>
        <p>Retry network errors and 5xx answers with a growing delay. A 4xx answer is final and is not retried.</p>
      </hgroup>
      <div className="scenarios">
        {(Object.keys(scenarios) as Scenario[]).map((scenario) => (
          <button key={scenario} type="button" className="outline" disabled={loading} onClick={() => run(scenario)}>
            {scenario}
          </button>
        ))}
      </div>
      <div className="grid-2">
        <article>
          <h6>Attempts</h6>
          {attempts.length === 0 && !loading && <p className="muted">Pick a scenario.</p>}
          <table>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.attempt}>
                  <td>#{attempt.attempt}</td>
                  <td>
                    <code>{attempt.status === 0 ? "network error" : attempt.status}</code>
                  </td>
                  <td>{describe(attempt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p aria-busy="true">Waiting...</p>}
        </article>
        <article>
          <h6>Result</h6>
          {!result && <p className="muted">{loading ? "Still trying." : "Nothing yet."}</p>}
          {result?.quote && (
            <blockquote>
              {result.quote.quote}
              <footer>
                <cite>{result.quote.author}</cite>
              </footer>
            </blockquote>
          )}
          {result?.error && <p className="error">{result.error}</p>}
          {result && <small className="muted">Finished after {result.ms} ms.</small>}
        </article>
      </div>
    </main>
  );
};
