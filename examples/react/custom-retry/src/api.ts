import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Quote = { id: number; quote: string; author: string };
type ApiError = { message: string };

export const getQuote = client.createRequest<{ response: Quote; error: ApiError }>()({
  endpoint: "/quotes/random",
});

// ---------- Retry policy ----------

/** Status 0 is a network error or a timeout. 5xx is a server problem that may be gone in a moment. 4xx will not change. */
export const isRetryable = (status: number | null) => status === 0 || (status !== null && status >= 500);

export type Attempt = { attempt: number; status: number | null; willRetry: boolean; delay: number };

/**
 * Exponential backoff with jitter: 250 ms, 500 ms, 1 s, 2 s, each plus up to 100 ms at random, so many clients that
 * failed together do not come back at the same moment. `send()` never throws, so the loop reads the status.
 */
export const withBackoff = async <T extends { success: boolean; status: number | null }>(
  send: () => Promise<T>,
  {
    retries = 4,
    baseDelay = 250,
    onAttempt,
  }: { retries?: number; baseDelay?: number; onAttempt: (attempt: Attempt) => void },
): Promise<T> => {
  for (let attempt = 1; ; attempt += 1) {
    const response = await send();
    const willRetry = !response.success && isRetryable(response.status) && attempt <= retries;
    const delay = willRetry ? Math.round(baseDelay * 2 ** (attempt - 1) + Math.random() * 100) : 0;
    onAttempt({ attempt, status: response.status, willRetry, delay });
    if (!willRetry) return response;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

// ---------- Simulated server ----------

/** dummyjson does not fail on demand, so the request is mocked. The policy above only sees statuses, like with a real API. */
export const scenarios = {
  "503 twice, then OK": [503, 503, 200],
  "Network error twice, then OK": [0, 0, 200],
  "404 Not found": [404],
  "500 every time": [500],
} satisfies Record<string, number[]>;

export type Scenario = keyof typeof scenarios;

let script: number[] = [];

export const startScenario = (scenario: Scenario) => {
  script = [...scenarios[scenario]];
};

getQuote.setMock(
  () => {
    // The last status of a scenario repeats for every next attempt.
    const status = script.length > 1 ? (script.shift() ?? 200) : (script[0] ?? 200);
    if (status === 200) {
      return { data: { id: 1, quote: "Make it work, make it right, make it fast.", author: "Kent Beck" }, status };
    }
    return { error: { message: status === 0 ? "Failed to fetch" : `Server answered ${status}` }, status };
  },
  { responseTime: 300 },
);
