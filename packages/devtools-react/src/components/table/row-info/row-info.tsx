import { useRef, useState } from "react";
import { CircleCheck, Copy } from "lucide-react";

import { useClipboard } from "hooks/use-clipboard";
import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css }) => {
  return {
    row: css`
      background: transparent !important;
    `,
    label: css`
      width: 1px;
      font-weight: 400;
      font-size: 13px;
      white-space: nowrap;
    `,
    value: css`
      position: relative;
      max-width: 100px;
      white-space: nowrap;
      font-weight: 600;
      font-size: 13px;
      color: ${isLight ? tokens.colors.light[800] : tokens.colors.light[100]};
    `,
    content: css`
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      height: 24px;
      transform: translateY(2px);

      & div {
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }
    `,
    icon: css`
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: 0;
      border-radius: 4px;
      padding: 0 2px;
      z-index: 10;

      & svg {
        max-width: 16px;
        max-height: 16px;
        stroke: ${isLight ? tokens.colors.light[800] : tokens.colors.light[100]};
      }
      & svg.copied {
        stroke: ${isLight ? tokens.colors.green[600] : tokens.colors.green[400]};
      }
    `,
  };
});

export const RowInfo = ({ label, value, copyText }: { label: string; value: React.ReactNode; copyText?: string }) => {
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

  const onCopy = () => {
    if (copyText) {
      copy(copyText);
    }
  };

  return (
    <tr className={css.row}>
      <td className={css.label}>{label}</td>
      <td className={css.value} style={{ paddingLeft: copyText ? "40px" : "15px" }}>
        {copyText && (
          <button type="button" onClick={onCopy} className={css.icon}>
            {copied ? <CircleCheck className="copied" /> : <Copy />}
          </button>
        )}
        <div className={css.content}>{value}</div>
      </td>
    </tr>
  );
};
