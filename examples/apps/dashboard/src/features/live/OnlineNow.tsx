import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getOnlineNow } from "../../api/stats";
import { Widget } from "../../components/Widget";

export const OnlineNow = () => {
  const [history, setHistory] = useState<number[]>([]);
  // Polling: a new request every 3 seconds.
  const { data, error, loading, refetch, responseTimestamp, onSuccess } = useFetch(getOnlineNow, {
    refresh: true,
    refreshTime: 3000,
    // Pause while the tab is in the background. Nobody is looking at the number then.
    refetchBlurred: false,
  });

  onSuccess(({ response }) => setHistory((values) => [...values, response.data.online].slice(-20)));

  const min = Math.min(...history);
  const range = Math.max(1, Math.max(...history) - min);

  return (
    <Widget title="Online now" loading={loading} error={error} onRetry={refetch} updatedAt={responseTimestamp}>
      <p className="kpi">
        {data?.online ?? "-"} <small className="live">live</small>
      </p>
      <div className="sparkline" aria-hidden="true">
        {history.map((value, index) => (
          <span key={index} style={{ height: `${10 + ((value - min) / range) * 90}%` }} />
        ))}
      </div>
    </Widget>
  );
};
