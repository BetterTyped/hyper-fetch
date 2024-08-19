import { useDevtoolsContext } from "devtools.context";

export const Visualizer = () => {
  const { client } = useDevtoolsContext("DevtoolsVisualizer");

  return (
    <div>
      <h1>Visualizer</h1>

      <div>
        <h2>Client</h2>
        <pre>
          {JSON.stringify(
            [...client.__requestsMap.values()].map((r) => ({ endpoint: r.endpoint, method: r.method })),
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
};
