import { useFetch, useListener, useSubmit } from "@hyper-fetch/react";

import { advanceOrder, client, getOrders, onOrderEvent, type Order, type OrderEvent } from "./api";

/** Applies one pushed event to the cached list: update the order in place, or add a new one on top. */
const applyEvent = ({ type, order }: OrderEvent) => {
  client.cache.update(getOrders, (cached) => {
    if (!cached?.data) return {};
    const list =
      type === "created" ? [order, ...cached.data] : cached.data.map((item) => (item.id === order.id ? order : item));
    return { data: list.slice(0, 8) };
  });
};

/** `useFetch` loads the list once. The listener keeps that cache entry current, like an SWR subscription. */
const useLiveOrders = () => {
  const orders = useFetch(getOrders);
  const listener = useListener(onOrderEvent);
  listener.onEvent(({ data }) => applyEvent(data));
  return { ...orders, connected: listener.connected };
};

const AdvanceButton = ({ order }: { order: Order }) => {
  const { submit, submitting } = useSubmit(advanceOrder.setParams({ orderId: order.id }));
  // Only a POST. The new status comes back through the event stream, here and in every other tab.
  return (
    <button
      type="button"
      className="outline"
      aria-busy={submitting}
      disabled={order.status === "delivered"}
      onClick={() => submit()}
    >
      Advance
    </button>
  );
};

export const App = () => {
  const { data, error, loading, connected } = useLiveOrders();

  return (
    <main className="container">
      <hgroup>
        <h1>Live orders</h1>
        <p>The list is fetched once. Every change after that is pushed by the server and written into the cache.</p>
      </hgroup>
      <p>
        {connected ? <ins>● Live</ins> : <span aria-busy="true">Connecting to /api/events</span>}{" "}
        <small className="muted">Open a second tab and press Advance there.</small>
      </p>
      {loading && !data && <p aria-busy="true">Loading orders...</p>}
      {error && <p className="error">Could not load orders: {error.message}</p>}
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.map((order) => (
            // A new `updatedAt` makes a new key, so the row mounts again and its highlight animation replays.
            <tr key={`${order.id}-${order.updatedAt}`} className="flash">
              <td>#{order.id}</td>
              <td>{order.customer}</td>
              <td>${order.total}</td>
              <td>
                <mark className={order.status}>{order.status}</mark>
              </td>
              <td>
                <small className="muted">{new Date(order.updatedAt).toLocaleTimeString()}</small>
              </td>
              <td>
                <AdvanceButton order={order} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};
