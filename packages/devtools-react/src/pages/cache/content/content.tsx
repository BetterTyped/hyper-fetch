/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";

export const Content = () => {
  const { cache } = useDevtoolsContext("DevtoolsNetworkContent");

  return (
    <div>
      {cache.map((item, index) => {
        return (
          <div key={index}>
            <div>{JSON.stringify(item.data)}</div>
            <div>{JSON.stringify(item.error)}</div>
            <div>{JSON.stringify(item.status)}</div>
            <div>{JSON.stringify(item.extra)}</div>
          </div>
        );
      })}
    </div>
  );
};
