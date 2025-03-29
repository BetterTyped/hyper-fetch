/* eslint-disable max-params */
/* eslint-disable react/no-unstable-nested-components */
import { CommonExternalProps, JSONTree } from "react-json-tree";
import { produce } from "immer";

import { Value } from "./value/value";
import { Label } from "./label/label";
import { getRaw, getTheme, updateValue } from "./json-viewer.utils";

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
    <div className="px-2.5 [&_*]:text-xs [&_*]:font-mono [&>ul]:m-0 [&_ul]:relative [&_label]:min-h-[19px] [&_ul>li]:-translate-x-2.5 [&_ul>li>div>div]:text-light-400 dark:[&_ul>li>div>div]:text-dark-200 [&_ul>li>div]:-ml-1.5 [&_ul>li>div]:after:absolute [&_ul>li>div]:after:content-[''] [&_ul>li>div]:after:block [&_ul>li>div]:after:w-0.5 [&_ul>li>div]:after:bg-light-300 dark:[&_ul>li>div]:after:bg-dark-500 [&_ul>li>div]:after:top-[25px] [&_ul>li>div]:after:left-[-3px] [&_ul>li>div]:after:bottom-[5px] [&_li:has(:nth-child(3))>ul]:grid [&_li:has(:nth-child(3))>ul]:grid-cols-1 [&_li:has(:nth-child(3))>ul]:w-[calc(100%-0.675em)] [&_li:not(:has(:nth-child(3)))]:flex [&_li:not(:has(:nth-child(3)))>span]:flex-1 [&_*]:box-border">
      <JSONTree
        {...props}
        shouldExpandNodeInitially={shouldExpandNodeInitially}
        hideRoot={hideRoot}
        data={data}
        theme={getTheme({ isLight: false })}
        valueRenderer={(value, raw, ...path: (string | number)[]) => (
          <Value value={value} raw={raw} onChange={handleOnChange(path)} disabled={!onChange} />
        )}
        labelRenderer={(path, nodeType, expanded, expandable) => (
          <Label label={path[0]} getRaw={() => getRaw(data, path)} expandable={expandable} />
        )}
      />
    </div>
  );
};
