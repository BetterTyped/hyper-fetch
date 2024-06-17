import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";

export const Header = () => {
  const { setModule, success, failed, inProgress, paused, canceled } = useDevtoolsContext("DevtoolsHeader");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
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
      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <div>Success {success.length}</div>
        <div>Failed {failed.length}</div>
        <div>In Progress {inProgress.length}</div>
        <div>Paused {paused.length}</div>
        <div>Canceled {canceled.length}</div>
        <div className="spacer" />

        <button type="button">go offline</button>
        <button type="button">options</button>
      </div>
    </div>
  );
};
