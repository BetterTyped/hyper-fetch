import { produce } from "immer";
import { Copy } from "lucide-react";
/* eslint-disable max-params */
/* eslint-disable react/no-unstable-nested-components */
import type { CommonExternalProps } from "react-json-tree";
import { JSONTree } from "react-json-tree";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { jsonViewerStyles } from "./json-viewer.styles";
import { getRaw, theme, toDataKeys, updateValue } from "./json-viewer.utils";
import { Label } from "./label/label";
import { Value } from "./value/value";
import { useClipboard } from "@/hooks/use-clipboard";

const CopyButton = ({ data }: { data: any }) => {
  const { copy } = useClipboard({
    onSuccess: () => toast.success("Copied to clipboard"),
    onError: () => toast.error("Could not copy to clipboard"),
  });
  const handleCopy = () => copy(JSON.stringify(data, null, 2));

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Copy JSON"
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
  // Without `onChange` the values are disabled, so they never call this
  const handleOnChange = (path: (number | string)[]) => (value: any) => {
    onChange?.(
      produce(data, (draft: any) => {
        updateValue(draft, toDataKeys(path, hideRoot), value);
      }),
    );
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
          <Label label={path[0]} getRaw={() => getRaw(data, toDataKeys(path, hideRoot))} expandable={expandable} />
        )}
      />
      <CopyButton data={data} />
    </div>
  );
};
