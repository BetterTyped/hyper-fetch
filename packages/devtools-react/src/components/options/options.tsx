import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { IconButton } from "components/icon-button/icon-button";
import { Toolbar } from "components/toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { ChevronIcon } from "icons/chevron";
import { OptionsIcon } from "icons/options";
import { WifiIcon } from "icons/wifi";
import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const positions = ["top", "left", "right", "bottom"] as const;

const styles = createStyles((isLight, css) => {
  return {
    button: css`
      display: flex;
      justify-content: center;
      align-items: center;
      border: 0px;
      border-radius: 100%;
      padding: 6px;
      width: 28px;
      height: 28px;
      background: transparent;
      transition: all 0.2s ease;

      &:hover {
        background: ${isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"};
      }

      & svg {
        width: 18px !important;
        height: 18px !important;
      }
    `,
    menuContent: css`
      z-index: 999999;
      min-width: 220px;
      background-color: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[800]};
      border-radius: 6px;
      padding: 5px 0;
      box-shadow: ${tokens.shadow.md(isLight ? tokens.colors.light[300] : tokens.colors.dark[800])};
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[100]};
      animation-duration: 400ms;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      will-change: transform, opacity;
    `,
    menuLabel: css`
      font-size: 10px;
      font-weight: 600;
      line-height: 25px;
      padding: 0px 2px;
      margin: 0 10px 4px;
      border-bottom: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.light[700] + tokens.alpha[20]};
      color: ${isLight ? tokens.colors.cyan[500] : tokens.colors.cyan[500]};
      text-transform: uppercase;
    `,
    item: css`
      position: relative;
      display: flex;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      cursor: pointer;
      color: ${isLight ? tokens.colors.dark[100] : tokens.colors.light[200]};
      &:hover {
        background: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[400]};
      }
    `,
    value: css`
      padding-left: 25px !important;
      text-transform: capitalize;
    `,
    rightSlot: css`
      margin-left: auto;

      & svg {
        fill: ${tokens.colors.light[600]};
        transform: rotate(-90deg);
        width: 12px;
      }
    `,
    subTrigger: css`
      font-size: 13px;
      line-height: 1;
      color: var(--violet-11);
      border-radius: 3px;
      display: flex;
      align-items: center;
      height: 25px;
      padding: 0 5px;
      position: relative;
      padding-left: 25px;
      user-select: none;
      outline: none;
    `,
    indicator: css`
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 40px;
    `,
    separator: css``,
    arrow: css`
      fill: ${tokens.colors.dark[800]};
    `,
  };
});

export const Options = ({ children }: { children: React.ReactNode }) => {
  const { isOnline, setIsOnline, position, setPosition, theme, setTheme } = useDevtoolsContext("DevtoolsOptions");
  const css = styles.useStyles();

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
          <DropdownMenu.Trigger className={css.button}>
            <OptionsIcon />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className={css.menuContent} sideOffset={5}>
              <DropdownMenu.Label className={css.menuLabel}>Settings</DropdownMenu.Label>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className={css.item}>
                  Theme
                  <div className={css.rightSlot}>
                    <ChevronIcon />
                  </div>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className={css.menuContent} sideOffset={2} alignOffset={-5}>
                    <DropdownMenu.Label className={css.menuLabel}>Theme</DropdownMenu.Label>
                    <DropdownMenu.RadioGroup value={theme} onValueChange={setTheme as any}>
                      <DropdownMenu.RadioItem className={styles.clsx(css.item, css.value)} value="light">
                        <DropdownMenu.ItemIndicator className={css.indicator}>·</DropdownMenu.ItemIndicator>
                        Light
                      </DropdownMenu.RadioItem>
                      <DropdownMenu.RadioItem className={styles.clsx(css.item, css.value)} value="dark">
                        <DropdownMenu.ItemIndicator className={css.indicator}>·</DropdownMenu.ItemIndicator>
                        Dark
                      </DropdownMenu.RadioItem>
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className={css.item}>
                  Position
                  <div className={css.rightSlot}>
                    <ChevronIcon />
                  </div>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className={css.menuContent} sideOffset={2} alignOffset={-5}>
                    <DropdownMenu.Label className={css.menuLabel}>Position</DropdownMenu.Label>
                    <DropdownMenu.RadioGroup value={position} onValueChange={setPosition as any}>
                      {positions.map((item) => (
                        <DropdownMenu.RadioItem key={item} className={styles.clsx(css.item, css.value)} value={item}>
                          <DropdownMenu.ItemIndicator className={css.indicator}>·</DropdownMenu.ItemIndicator>
                          {item}
                        </DropdownMenu.RadioItem>
                      ))}
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
              <DropdownMenu.Arrow className={css.arrow} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </Toolbar>
  );
};
