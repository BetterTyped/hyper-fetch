import { Resizable } from "re-resizable";

import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      position: fixed;
      z-index: 9999;
      left: 0;
      right: 0;
      bottom: 0;
      overflow-y: hidden;
      background: rgb(35 39 46);
      border: 1px solid #7e8186;
      border-radius: 10px 10px 0 0;
      color: rgb(180, 194, 204);
      * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif !important;
      }
    `,
  };
});

export const DevtoolsWrapper = ({ children }: { children: React.ReactNode }) => {
  const css = styles.useStyles();

  return (
    <Resizable
      defaultSize={{ width: "100%", height: 400 }}
      minHeight={44}
      minWidth={44}
      maxHeight="100vh"
      maxWidth="100vw"
      style={{
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        zIndex: 9999,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: "hidden",
        background: "rgb(35 39 46)",
        border: "1px solid #7e8186",
        borderRadius: "10px 10px 0 0",
        color: "rgb(180, 194, 204)",
        fontFamily: "ui-sans-serif, Inter, system-ui, sans-serif, sans-serif!important",
      }}
    >
      <div className={css.wrapper}>{children}</div>
    </Resizable>
  );
};
