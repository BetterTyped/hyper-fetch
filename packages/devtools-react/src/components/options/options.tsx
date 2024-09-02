import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, MoonStar, Settings, Sun, Wifi, WifiOff } from "lucide-react";

import * as DropdownMenu from "components/dropdown/dropdown";
import { IconButton } from "components/icon-button/icon-button";
import { Toolbar } from "components/toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { tokens } from "theme/tokens";

export enum Positions {
  Top = "Top",
  Left = "Left",
  Right = "Right",
  Bottom = "Bottom",
}
const positionsIcons = {
  Top: <ArrowUp />,
  Left: <ArrowLeft />,
  Right: <ArrowRight />,
  Bottom: <ArrowDown />,
};

export const Options = ({ children }: { children: React.ReactNode }) => {
  const { isOnline, setIsOnline, position, setPosition, theme, setTheme } = useDevtoolsContext("DevtoolsOptions");

  return (
    <Toolbar>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: "1 1 auto",
          gap: "5px",
        }}
      >
        {children}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <IconButton onClick={() => setIsOnline(!isOnline)}>
          {isOnline ? <Wifi stroke={tokens.colors.green[500]} /> : <WifiOff />}
        </IconButton>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton>
              <Settings />
            </IconButton>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content sideOffset={5}>
            <DropdownMenu.Label>
              <Settings />
              Settings
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Theme</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent sideOffset={2} alignOffset={-5}>
                <DropdownMenu.RadioGroup value={theme} onValueChange={setTheme as any}>
                  <DropdownMenu.RadioItem value="light">
                    Light
                    <DropdownMenu.Shortcut>
                      <Sun />
                    </DropdownMenu.Shortcut>
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="dark">
                    Dark
                    <DropdownMenu.Shortcut>
                      <MoonStar />
                    </DropdownMenu.Shortcut>
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Position</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent sideOffset={2} alignOffset={-5}>
                <DropdownMenu.RadioGroup value={position} onValueChange={setPosition as any}>
                  {Object.values(Positions).map((item) => (
                    <DropdownMenu.RadioItem key={item} value={item}>
                      {item}
                      <DropdownMenu.Shortcut>{positionsIcons[item]}</DropdownMenu.Shortcut>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </Toolbar>
  );
};
