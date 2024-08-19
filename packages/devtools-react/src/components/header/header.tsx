import { Button } from "components/header/button/button";
import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";
import { IconButton } from "components/icon-button/icon-button";
import { LogoIcon } from "icons/logo";
import { NetworkIcon } from "icons/network";
import { CacheIcon } from "icons/cache";
import { ProcessingIcon } from "icons/processing";
import { CloseIcon } from "icons/close";
import { ExplorerIcon } from "icons/explorer";

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
      <button type="button" className={css.heading} onClick={() => setModule(DevtoolsModule.NETWORK)}>
        <LogoIcon style={{ padding: "0 0 0 5px" }} />
        <div className={css.title}>DevTools</div>
      </button>
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
        <Button color={getColor(DevtoolsModule.VISUALIZATION)} onClick={() => setModule(DevtoolsModule.VISUALIZATION)}>
          <ExplorerIcon fill={getIconColor(DevtoolsModule.VISUALIZATION)} />
          Explorer
        </Button>
        <IconButton
          style={{ height: "32px", width: "32px", marginTop: "2px", marginLeft: "7px" }}
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  );
};
