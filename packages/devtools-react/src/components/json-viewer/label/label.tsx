import { useEffect, useRef, useState } from "react";

import { CopyIcon } from "icons/copy";
import { AcceptedIcon } from "icons/accepted";
import { useClipboard } from "hooks/use-clipboard";

import { styles } from "../json-viewer.styles";

export const Label = ({
  label,
  getRaw,
  expandable,
}: {
  label: string | number;
  expandable: boolean;
  getRaw: () => string;
}) => {
  const css = styles.useStyles();
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
      <span className={css.label}>{label}:</span>
      {expandable && (
        // Prevents some propagation issues with span instead of button
        <span
          tabIndex={0}
          role="button"
          className={css.copy}
          onClick={handleCopy}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCopy(e);
            }
          }}
        >
          {copied ? <AcceptedIcon className="copied" /> : <CopyIcon />}
        </span>
      )}
    </>
  );
};
