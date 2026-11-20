/**
 * Where the subscription of `useListener` is:
 * - `idle` - not listening yet (e.g. during server rendering)
 * - `starting` - subscribed, waiting for the server to confirm it (tRPC, oRPC)
 * - `listening` - messages can arrive. Adapters without confirmation get here right after subscribing
 * - `ended` - the server finished the subscription
 * - `failed` - the server ended the subscription with an error, see `error`
 *
 * After `ended` or `failed` the hook stays unsubscribed until `listen()` is called or the listener changes.
 */
export type ListenerStatusType = "idle" | "starting" | "listening" | "ended" | "failed";

export type UseListenerOptionsType<DataType = any, TSelected = DataType> = {
  /** When true (default), only re-renders when accessed state properties change */
  dependencyTracking?: boolean;
  /**
   * Pick or transform the part of the message data used by the component.
   * With a selector the `data` value updates only when the selected value changes,
   * so components reading `data` rerender only for the relevant messages.
   */
  select?: (data: DataType) => TSelected;
  /**
   * Keep references of the unchanged parts of the selected data between messages (default true).
   * Applies to the `select` result - without a selector every message updates the data.
   */
  structuralSharing?: boolean;
};
