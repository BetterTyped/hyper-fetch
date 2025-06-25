/* eslint-disable max-params */
/* eslint-disable react/no-unstable-nested-components */
import { CommonExternalProps, JSONTree } from "react-json-tree";
import { produce } from "immer";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Value } from "./value/value";
import { Label } from "./label/label";
import { getRaw, theme, updateValue } from "./json-viewer.utils";
import { Button } from "../ui/button";

import { jsonViewerStyles } from "./json-viewer.styles";

const CopyButton = ({ data }: { data: any }) => {
  const handleCopy = () => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    toast.success("Copied to clipboard");
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={handleCopy}
      className="w-9 h-9 absolute top-1 right-1 opacity-50 group-hover:opacity-100"
    >
      <Copy className="w-6 h-6" />
    </Button>
  );
};

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
        <span className="inline-flex text-red-500">{String(data)}</span>
      </div>
    );
  }

  return (
    <div className={jsonViewerStyles.base}>
      <JSONTree
        {...props}
        shouldExpandNodeInitially={shouldExpandNodeInitially}
        hideRoot={hideRoot}
        data={data}
        theme={theme}
        valueRenderer={(value, raw, ...path: (string | number)[]) => (
          <Value value={value} raw={raw} path={path} onChange={handleOnChange(path)} disabled={!onChange} />
        )}
        labelRenderer={(path, _, __, expandable) => (
          <Label label={path[0]} getRaw={() => getRaw(data, path)} expandable={expandable} />
        )}
      />
      <CopyButton data={data} />
    </div>
  );
};
