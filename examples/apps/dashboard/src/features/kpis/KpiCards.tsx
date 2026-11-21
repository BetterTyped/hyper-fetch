import { useFetch } from "@hyper-fetch/react";

import { type CountedResource, countOf, getRevenue } from "../../api/stats";
import { Widget } from "../../components/Widget";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" });

// Refetch the numbers when the user comes back to the tab or the connection returns.
const options = { refetchOnFocus: true, refetchOnReconnect: true };

const CountCard = ({ title, resource }: { title: string; resource: CountedResource }) => {
  const { data, error, loading, refetch, responseTimestamp } = useFetch(countOf(resource), options);

  return (
    <Widget title={title} loading={loading} error={error} onRetry={refetch} updatedAt={responseTimestamp}>
      <p className="kpi">{data?.total.toLocaleString() ?? "-"}</p>
    </Widget>
  );
};

const RevenueCard = () => {
  // `select` keeps only the sum in this component. The cached response stays the full list.
  const { data, error, loading, refetch, responseTimestamp } = useFetch(getRevenue, {
    ...options,
    select: ({ carts }) => carts.reduce((sum, cart) => sum + cart.discountedTotal, 0),
  });

  return (
    <Widget title="Revenue" loading={loading} error={error} onRetry={refetch} updatedAt={responseTimestamp}>
      <p className="kpi">{data === null ? "-" : money.format(data)}</p>
    </Widget>
  );
};

/** Four `useFetch` calls on one screen run in parallel. Each card shows its own state. */
export const KpiCards = () => (
  <>
    <CountCard title="Customers" resource="users" />
    <CountCard title="Products" resource="products" />
    <CountCard title="Orders" resource="carts" />
    <RevenueCard />
  </>
);
