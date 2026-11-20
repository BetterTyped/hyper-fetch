/** Above this exponent `min * 2 ** attempt` is past any sane maximum, and a larger one only risks Infinity */
const maxBackoffExponent = 30;

/**
 * Delay before the reconnection attempt `attempt` (from 0): exponential backoff with full jitter and a floor,
 * `min + random(0, min(max - min, min * 2 ** attempt))`. Every client of a restarted server comes back at another
 * moment, and no delay is shorter than `min` or longer than `max`.
 */
export const getReconnectDelay = ({
  attempt,
  min,
  max,
  random = Math.random,
}: {
  attempt: number;
  min: number;
  max: number;
  random?: () => number;
}): number => {
  const floor = Math.max(0, min);
  const exponent = Math.min(Math.max(0, attempt), maxBackoffExponent);
  const window = Math.max(0, Math.min(max - floor, floor * 2 ** exponent));
  return Math.round(floor + random() * window);
};
