/* eslint-disable react/no-unstable-nested-components */
import { CommonExternalProps, JSONTree } from "react-json-tree";
import type { Theme } from "react-base16-styling";

import { Value } from "./value/value";
import { useDevtoolsContext } from "devtools.context";
import { Label } from "./label/label";
import { getRaw, updateValue } from "./json-viewer.utils";

import { styles } from "./json-viewer.styles";

const theme: Theme = {
  scheme: "bright",
  base00: "transparent",
  base01: "#444c56",
  base02: "#58626d",
  base03: "#6a737d",
  base04: "#a0a6ab",
  base05: "#c8ccd1",
  base06: "#e2e5e9",
  base07: "#f0f3f6",
  base08: "#ff5c57",
  base09: "#ff9f43",
  base0A: "#f3f99d",
  base0B: "#5af78e",
  base0C: "#9aedfe",
  base0D: "#b4c2cc",
  base0E: "#ff6ac1",
  base0F: "#b2643c",
  // eslint-disable-next-line max-params
  nestedNode: ({ style }) => {
    return {
      style: {
        ...style,
        transform: "translateX(10px)",
      },
    };
  },
};

export const JSONViewer = ({
  data,
  cacheKey,
  shouldExpandNodeInitially = () => true,
  hideRoot = true,
  ...props
}: {
  data: any;
  cacheKey?: string;
} & Partial<Omit<CommonExternalProps, "data" | "theme" | "valueRenderer">>) => {
  const { client } = useDevtoolsContext("DevtoolsJSONViewer");
  const css = styles.useStyles();

  const onChange = (path: (number | string)[]) => (value: any) => {
    if (cacheKey) {
      const newData = updateValue(data, path, value);

      client.cache.storage.set<any, any, any>(cacheKey, newData);
      client.cache.lazyStorage?.set<any, any, any>(cacheKey, newData);
      client.cache.events.emitCacheData<any, any, any>(cacheKey, newData);
    } else {
      console.error("Cache key is not provided");
    }
  };

  if (!data) {
    return (
      <div>
        <span
          className={css.value}
          style={{
            color: "#ff5c57",
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
        theme={theme}
        valueRenderer={(value, raw, ...path: (string | number)[]) => (
          <Value value={value} raw={raw} onChange={onChange(path)} disabled={!cacheKey} />
        )}
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, max-params
        labelRenderer={(path, _nodeType, _expanded, expandable) => (
          <Label label={path[0]} getRaw={() => getRaw(data, path)} expandable={expandable} />
        )}
      />
    </div>
  );
};
