import { Button } from "components/header/button/button";
import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";

export const Header = () => {
  const { module, setModule } = useDevtoolsContext("DevtoolsHeader");

  const getColor = (type: DevtoolsModule) => {
    return module === type ? "primary" : "secondary";
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          borderBottom: "1px solid #3d424a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0px 0 0 10px",
            gap: "8px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18px"
            zoomAndPan="magnify"
            viewBox="0 0 224.87999 299.999988"
            height="24px"
            preserveAspectRatio="xMidYMid meet"
            version="1.0"
            style={{ padding: "0 0 0 5px" }}
          >
            <defs>
              <clipPath id="58708a0c3a">
                <path
                  d="M 28.484375 0.078125 L 202.390625 0.078125 L 202.390625 299.917969 L 28.484375 299.917969 Z M 28.484375 0.078125 "
                  clipRule="nonzero"
                />
              </clipPath>
            </defs>
            <g clipPath="url(#58708a0c3a)">
              <path
                fill="#fbc646"
                d="M 80.019531 0.0859375 L 191.648438 0.0859375 L 144.414062 88.105469 L 202.378906 88.105469 L 62.128906 299.910156 L 99.335938 143.910156 L 28.496094 143.910156 L 80.019531 0.0859375 "
                fillOpacity="1"
                fillRule="nonzero"
              />
            </g>
          </svg>
          <div
            style={{
              color: "white",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            DevTools
          </div>
        </div>
        <div style={{ padding: "0 10px 0 0" }}>
          <Button color={getColor(DevtoolsModule.NETWORK)} onClick={() => setModule(DevtoolsModule.NETWORK)}>
            Network
          </Button>
          <Button color={getColor(DevtoolsModule.CACHE)} onClick={() => setModule(DevtoolsModule.CACHE)}>
            Cache
          </Button>
          <Button color={getColor(DevtoolsModule.LOGS)} onClick={() => setModule(DevtoolsModule.LOGS)}>
            Logs
          </Button>
          <Button color={getColor(DevtoolsModule.PROCESSING)} onClick={() => setModule(DevtoolsModule.PROCESSING)}>
            Processing
          </Button>
        </div>
      </div>
    </div>
  );
};
