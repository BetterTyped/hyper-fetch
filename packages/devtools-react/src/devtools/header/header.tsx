export const Header = () => {
  return (
    <div>
      <div>
        <button>Network</button>
        <button>Cache</button>
        <button>Logs</button>
        <button>Processing</button>
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
