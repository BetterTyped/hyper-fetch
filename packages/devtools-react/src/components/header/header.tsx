import { useEffect } from "react";

import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";

export const Header = () => {
  const { setModule, client } = useDevtoolsContext("DevtoolsHeader");

  const [success, setSuccess] = useState(0);
  const [failed, setFailed] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [paused, setPaused] = useState(0);

  const countProgressRequests = () => {
    const fetchRequests = client.fetchDispatcher.getAllRunningRequest();
    const submitRequests = client.fetchDispatcher.getAllRunningRequest();
    setInProgress(fetchRequests.length + submitRequests.length);
  };

  useEffect(() => {
    const unmountFetchQueue = client.requestManager.events.onRequestStartByQueue(() => {
      countProgressRequests();
    });

    return () => {
      unmountFetchQueue();
    };
  }, [client]);

  return (
    <div>
      <div>
        <button type="button" onClick={() => setModule(DevtoolsModule.NETWORK)}>
          Network
        </button>
        <button type="button" onClick={() => setModule(DevtoolsModule.CACHE)}>
          Cache
        </button>
        <button type="button" onClick={() => setModule(DevtoolsModule.LOGS)}>
          Logs
        </button>
        <button type="button" onClick={() => setModule(DevtoolsModule.PROCESSING)}>
          Processing
        </button>
      </div>
      <div>
        <button>Success</button>
        <button>Failed</button>
        <button>In Progress</button>
        <button>Paused</button>
        <button>Idle</button>
        <div className="spacer" />

        <button>go offline</button>
        <button>options</button>
      </div>
    </div>
  );
};
