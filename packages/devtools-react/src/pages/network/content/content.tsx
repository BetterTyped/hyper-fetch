import { useDevtoolsContext } from "devtools.context";

export const Content = () => {
  const { success, failed } = useDevtoolsContext("DevtoolsNetworkContent");

  return (
    <div>
      Success
      {success.map((item) => {
        return (
          <div key={item.requestId}>
            <div>{item.request.endpoint}</div>
            <div>{JSON.stringify(item.response)}</div>
          </div>
        );
      })}
      Failed
      {failed.map((item) => {
        return (
          <div key={item.requestId}>
            <div>{item.request.endpoint}</div>
            <div>{JSON.stringify(item.response)}</div>
          </div>
        );
      })}
    </div>
  );
};
