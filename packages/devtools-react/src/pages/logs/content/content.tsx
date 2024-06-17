/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";

export const Content = () => {
  const { requests, logs } = useDevtoolsContext("DevtoolsLogsContent");

  return (
    <div>
      {requests.map((item) => {
        const requestLogs = logs.filter((log) => log.extra?.requestId === item.requestId);
        return (
          <div>
            <div>
              <div>{JSON.stringify(item.requestId)}</div>
              <div>{JSON.stringify(item.request.endpoint)}</div>
            </div>
            {requestLogs.map((log, index) => {
              return (
                <div key={index}>
                  <div style={{ paddingLeft: "20px" }}>
                    <div>{JSON.stringify(index)}.</div>
                    <div>{JSON.stringify(log.message)}</div>
                    <div>{JSON.stringify(log.extra)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
