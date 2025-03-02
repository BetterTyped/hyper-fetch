import { createStyles } from "frontend/theme/use-styles.hook";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";
import { DevtoolsModule } from "frontend/pages/project/_context/devtools.types";
import { menuIcons } from "./menu.constants";
import { tokens } from "frontend/theme/tokens";
import { useAppContext } from "../app.context";

const styles = createStyles(({ isLight, css }) => {
  return {
    menu: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 68px;
      min-width: 68px;
      border-right: 1px solid ${isLight ? tokens.colors.light[300] : tokens.colors.dark[400]};
      overflow-y: auto;
      padding: 10px 5px;
    `,

    menuLink: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border: 0px;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
      background: transparent;
      color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[500]};
      padding: 10px 0;
      width: 100%;

      & svg {
        width: 18px !important;
        height: 18px !important;
        fill: transparent;
      }

      &:hover {
        background: ${isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.1)"};
      }

      &:focus-within {
        outline-offset: 0px !important;
      }
    `,

    mobileLink: css`
      font-size: 0px;
      gap: 0px;
    `,

    active: css`
      color: ${isLight ? tokens.colors.dark[300] : tokens.colors.light[50]};

      & svg {
        stroke: ${isLight ? tokens.colors.cyan[300] : tokens.colors.cyan[300]}!important;
      }
    `,
  };
});

export enum Positions {
  Top = "Top",
  Left = "Left",
  Right = "Right",
  Bottom = "Bottom",
}

const MenuLink = ({ view, isMobile }: { view: DevtoolsModule; isMobile: boolean }) => {
  const css = styles.useStyles();
  const { module, setModule } = useDevtoolsContext("DevtoolsMenuLink");

  if (!menuIcons?.[view]) return null;

  const Icon = menuIcons[view] as React.FC<any>;
  const isActive = module === view;
  const onClick = () => setModule(view);

  return (
    <button
      type="button"
      onClick={onClick}
      className={css.clsx(css.menuLink, { [css.active]: isActive, [css.mobileLink]: isMobile })}
    >
      <Icon />
      {view}
    </button>
  );
};

export const Menu = (props: React.HTMLProps<HTMLDivElement>) => {
  const css = styles.useStyles();
  const { height } = useAppContext("ApplicationMenu");

  const isMobile = height < 450;

  return (
    <div {...props} className={css.menu}>
      {Object.values(DevtoolsModule).map((view) => (
        <MenuLink key={view} view={view} isMobile={isMobile} />
      ))}
      <div style={{ flex: 1 }} />
    </div>
  );
};
