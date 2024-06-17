import { useDevtoolsContext } from "devtools.context";

export const Content = () => {
  const { requests } = useDevtoolsContext("DevtoolsNetworkContent");

  return (
    <div>
      Requests
      {requests.map((item) => {
        return (
          <div key={item.requestId}>
            <div>{item.request.endpoint}</div>
            <div>isSuccess: {String(item.isSuccess)}</div>
            <div>isFinished: {String(item.isFinished)}</div>
            <div>isCanceled: {String(item.isCanceled)}</div>
            <div>data: {JSON.stringify(item.response)}</div>
          </div>
        );
      })}
    </div>
  );
};
