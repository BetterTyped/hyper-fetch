import { Button } from "components/header/button/button";
import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";
import { IconButton } from "components/icon-button/icon-button";
import { LogoIcon } from "icons/logo";
import { NetworkIcon } from "icons/network";
import { CacheIcon } from "icons/cache";
import { ProcessingIcon } from "icons/processing";
import { LogsIcon } from "icons/logs";
import { CloseIcon } from "icons/close";

import { styles } from "./header.styles";

export const Header = () => {
  const { module, setModule, setOpen } = useDevtoolsContext("DevtoolsHeader");
  const css = styles.useStyles();

  const getColor = (type: DevtoolsModule) => {
    return module === type ? "primary" : "secondary";
  };

  const getIconColor = (type: DevtoolsModule) => {
    return module === type ? "rgb(88 196 220)" : "rgb(180, 194, 204)";
  };

  return (
    <div className={css.wrapper}>
      <div className={css.heading}>
        <LogoIcon style={{ padding: "0 0 0 5px" }} />
        <div className={css.title}>DevTools</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
        <Button color={getColor(DevtoolsModule.NETWORK)} onClick={() => setModule(DevtoolsModule.NETWORK)}>
          <NetworkIcon fill={getIconColor(DevtoolsModule.NETWORK)} />
          Network
        </Button>
        <Button color={getColor(DevtoolsModule.CACHE)} onClick={() => setModule(DevtoolsModule.CACHE)}>
          <CacheIcon fill={getIconColor(DevtoolsModule.CACHE)} />
          Cache
        </Button>
        <Button color={getColor(DevtoolsModule.PROCESSING)} onClick={() => setModule(DevtoolsModule.PROCESSING)}>
          <ProcessingIcon fill={getIconColor(DevtoolsModule.PROCESSING)} />
          Processing
        </Button>
        <Button color={getColor(DevtoolsModule.LOGS)} onClick={() => setModule(DevtoolsModule.LOGS)}>
          <LogsIcon fill={getIconColor(DevtoolsModule.LOGS)} />
          Logs
        </Button>
        <IconButton style={{ height: "36px", width: "36px", marginTop: "2px" }} onClick={() => setOpen(false)}>
          <CloseIcon fill="#b6b9be" />
        </IconButton>
      </div>
    </div>
  );
};
