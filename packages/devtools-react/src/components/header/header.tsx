/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useState } from "react";
import { Cpu, DatabaseBackup, NetworkIcon, ShieldCloseIcon, SquareChartGantt } from "lucide-react";

import { Button } from "components/header/button/button";
import { useDevtoolsContext } from "devtools.context";
import { DevtoolsModule } from "devtools.types";
import { IconButton } from "components/icon-button/icon-button";
import { FullLogoIcon } from "icons/full-logo";
import { tokens } from "theme/tokens";

import { styles } from "./header.styles";

export const Header = () => {
  const css = styles.useStyles();

  const { module, setModule, setOpen, size, theme } = useDevtoolsContext("DevtoolsHeader");

  const [small, setSmall] = useState(false);

  const getColor = (type: DevtoolsModule) => {
    return module === type ? "primary" : "secondary";
  };

  const getIconColor = (type: DevtoolsModule) => {
    return module === type ? "rgb(88 196 220)" : "rgb(180, 194, 204)";
  };

  useEffect(() => {
    if (typeof size.width === "number" && size.width < 650) {
      setSmall(true);
    } else {
      setSmall(false);
    }
  }, [size]);

  return (
    <div className={css.wrapper}>
      <button type="button" className={css.heading} onClick={() => setModule(DevtoolsModule.NETWORK)}>
        <FullLogoIcon height="30px" style={{ fill: theme === "light" ? tokens.colors.dark[200] : "#fff" }} />
      </button>
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
        <Button
          small={small}
          color={getColor(DevtoolsModule.NETWORK)}
          onClick={() => setModule(DevtoolsModule.NETWORK)}
        >
          <NetworkIcon fill={getIconColor(DevtoolsModule.NETWORK)} />
          Network
        </Button>
        <Button small={small} color={getColor(DevtoolsModule.CACHE)} onClick={() => setModule(DevtoolsModule.CACHE)}>
          <DatabaseBackup fill={getIconColor(DevtoolsModule.CACHE)} />
          Cache
        </Button>
        <Button
          small={small}
          color={getColor(DevtoolsModule.PROCESSING)}
          onClick={() => setModule(DevtoolsModule.PROCESSING)}
        >
          <Cpu fill={getIconColor(DevtoolsModule.PROCESSING)} />
          Processing
        </Button>
        <Button
          small={small}
          color={getColor(DevtoolsModule.VISUALIZATION)}
          onClick={() => setModule(DevtoolsModule.VISUALIZATION)}
        >
          <SquareChartGantt fill={getIconColor(DevtoolsModule.VISUALIZATION)} />
          Explorer
        </Button>
        <IconButton
          style={{ height: "32px", width: "32px", marginTop: "2px", marginLeft: "7px" }}
          onClick={() => setOpen(false)}
        >
          <ShieldCloseIcon />
        </IconButton>
      </div>
    </div>
  );
};
