import { useEffect, useRef, useState } from "react";
import { CircleCheck, Copy } from "lucide-react";

import { useClipboard } from "frontend/hooks/use-clipboard";

export const Label = ({
  label,
  getRaw,
  expandable,
}: {
  label: string | number;
  expandable: boolean;
  getRaw: () => string;
}) => {
  const ref = useRef<ReturnType<typeof setTimeout>>();
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
    <>
      <span className="relative text-light-900 dark:text-light-300 whitespace-nowrap">{label}:</span>
      {expandable && (
        <span
          tabIndex={0}
          role="button"
          className="relative w-3 h-3 bg-transparent border-0 p-0 ml-1"
          onClick={handleCopy}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCopy(e);
            }
          }}
        >
          {copied ? (
            <CircleCheck className="w-3 h-3 translate-y-0.5 stroke-green-600 dark:stroke-green-400" />
          ) : (
            <Copy className="w-3 h-3 translate-y-0.5" />
          )}
        </span>
      )}
    </>
  );
};
