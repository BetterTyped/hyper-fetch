import * as DropdownMenu from "components/dropdown/dropdown";
import { IconButton } from "components/icon-button/icon-button";
import { Toolbar } from "components/toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { OptionsIcon } from "icons/options";
import { WifiIcon } from "icons/wifi";

const positions = ["Top", "Left", "Right", "Bottom"] as const;

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
          <WifiIcon isOnline={isOnline} />
        </IconButton>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton>
              <OptionsIcon />
            </IconButton>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content sideOffset={5}>
            <DropdownMenu.Label>Settings</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Theme</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent sideOffset={2} alignOffset={-5}>
                <DropdownMenu.RadioGroup value={theme} onValueChange={setTheme as any}>
                  <DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Position</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent sideOffset={2} alignOffset={-5}>
                <DropdownMenu.RadioGroup value={position} onValueChange={setPosition as any}>
                  {positions.map((item) => (
                    <DropdownMenu.RadioItem key={item} value={item}>
                      {item}
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
