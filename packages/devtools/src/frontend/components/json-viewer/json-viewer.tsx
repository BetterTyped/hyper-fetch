/* eslint-disable react/no-unstable-nested-components */
import { CommonExternalProps, JSONTree } from "react-json-tree";
import { produce } from "immer";

import { useDevtoolsContext } from "frontend/devtools.context";
import { Value } from "./value/value";
import { Label } from "./label/label";
import { getRaw, getTheme, updateValue } from "./json-viewer.utils";
import { tokens } from "frontend/theme/tokens";

import { styles } from "./json-viewer.styles";

export const JSONViewer = ({
  data,
  shouldExpandNodeInitially = () => true,
  hideRoot = true,
  onChange,
  ...props
}: {
  data: any;
  onChange?: (value: any) => void;
} & Partial<Omit<CommonExternalProps, "data" | "theme" | "valueRenderer">>) => {
  const css = styles.useStyles();
  const { theme } = useDevtoolsContext("JSONViewer");

  const handleOnChange = (path: (number | string)[]) => (value: any) => {
    if (onChange) {
      const newData = produce(data, (draft: any) => {
        updateValue(draft, path, value);
      });
      onChange(newData);
    } else {
      console.error("onChange is not provided");
    }
  };

  if (!data) {
    return (
      <div>
        <span
          className={css.value}
          style={{
            color: tokens.colors.red[500],
          }}
        >
          {String(data)}
        </span>
      </div>
    );
  }

  return (
    <div className={css.base}>
      <JSONTree
        {...props}
        shouldExpandNodeInitially={shouldExpandNodeInitially}
        hideRoot={hideRoot}
        data={data}
        theme={getTheme(theme === "light")}
        valueRenderer={(value, raw, ...path: (string | number)[]) => (
          <Value value={value} raw={raw} onChange={handleOnChange(path)} disabled={!onChange} />
        )}
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, max-params
        labelRenderer={(path, _nodeType, _expanded, expandable) => (
          <Label label={path[0]} getRaw={() => getRaw(data, path)} expandable={expandable} />
        )}
      />
    </div>
  );
};
