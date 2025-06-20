import { useEffect, useRef, useState } from "react";
import { CircleCheck, Copy } from "lucide-react";

import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";

import { jsonViewerStyles } from "../json-viewer.styles";

export const Label = ({
  label,
  getRaw,
  expandable,
}: {
  label: string | number;
  expandable: boolean;
  getRaw: () => string;
}) => {
  const ref = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copied, setCopied] = useState(false);

  const { copy } = useClipboard({
    onSuccess: () => {
      setCopied(true);
      clearTimeout(ref.current);
      ref.current = setTimeout(() => {
        setCopied(false);
      }, 1500);
    },
  });

  const handleCopy = (e: Pick<React.MouseEvent<HTMLButtonElement, MouseEvent>, "stopPropagation">) => {
    e.stopPropagation();
    const raw = getRaw();
    copy(JSON.stringify(raw));
  };

  useEffect(() => {
    return () => {
      clearTimeout(ref.current);
    };
  }, []);

  return (
    <span className="flex items-center mt-[1px]">
      <span className={cn(jsonViewerStyles.label)}>{label}:</span>
      {expandable && (
        <span
          tabIndex={0}
          role="button"
          className={cn(jsonViewerStyles.copy.wrapper)}
          onClick={handleCopy}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCopy(e);
            }
          }}
        >
          {copied ? <CircleCheck className={cn(jsonViewerStyles.copy.copied)} /> : <Copy />}
        </span>
      )}
    </span>
  );
};
