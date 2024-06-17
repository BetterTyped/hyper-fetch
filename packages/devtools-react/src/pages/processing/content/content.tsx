/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";

export const Content = () => {
  const { fetchQueues, submitQueues } = useDevtoolsContext("DevtoolsProcessingContent");
  return (
    <div>
      Fetch Queues
      {fetchQueues.map((queue, index) => {
        return (
          <div key={index}>
            <div>{queue.queueKey}</div>
            <div>{queue.requests.length}</div>
            <div>Stopped: {String(queue.stopped)}</div>
          </div>
        );
      })}
      {/* Todo make a switcher between fetch/submit queues */}
      Submit Queues
      {submitQueues.map((queue, index) => {
        return (
          <div key={index}>
            <div>{queue.queueKey}</div>
            <div>{queue.requests.length}</div>
            <div>Stopped: {String(queue.stopped)}</div>
          </div>
        );
      })}
    </div>
  );
};
