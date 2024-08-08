import { IconButton } from "components/icon-button/icon-button";
import { Toolbar } from "components/toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { OptionsIcon } from "icons/options";
import { WifiIcon } from "icons/wifi";

export const Options = ({ children }: { children: React.ReactNode }) => {
  const { isOnline, setIsOnline } = useDevtoolsContext("DevtoolsOptions");

  return (
    <Toolbar>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: "1 1 auto",
        }}
      >
        {children}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton onClick={() => setIsOnline(!isOnline)}>
          <WifiIcon isOnline={isOnline} />
        </IconButton>
        <IconButton>
          <OptionsIcon fill="#afb3b9" />
        </IconButton>
      </div>
    </Toolbar>
  );
};
