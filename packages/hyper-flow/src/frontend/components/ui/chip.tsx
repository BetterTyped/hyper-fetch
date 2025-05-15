import clsx from "clsx";

type ChipColor = "blue" | "green" | "red" | "gray" | "orange" | "normal" | "inactive";
type ChipSize = "small" | "medium";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ChipColor;
  size?: ChipSize;
}

const colorStyles: Record<ChipColor, string> = {
  blue: "text-blue-500 dark:text-[#00bbd4] bg-blue-300/30 dark:bg-dark-300",
  green: "text-green-500 dark:text-[#4caf50] bg-green-300/30 dark:bg-dark-300",
  red: "text-red-500 dark:text-[#f44336] bg-red-300/30 dark:bg-dark-300",
  gray: "text-[#8a94a6] dark:text-[#a0a9bb] bg-light-400/30 dark:bg-dark-300",
  orange: "text-orange-500 dark:text-[#ff9800] bg-orange-300/30 dark:bg-dark-300",
  normal: "text-dark-300 dark:text-white bg-dark-300/10 dark:bg-dark-300",
  inactive: "text-light-300 dark:text-[#607d8b] bg-dark-300/10 dark:bg-dark-300",
};

const sizeStyles: Record<ChipSize, string> = {
  small: "text-xs py-[3px] px-[6px]",
  medium: "text-sm py-[3px] px-[8px]",
};

export const Chip = ({ children, color = "green", size = "small", className, ...props }: ChipProps) => {
  const baseStyles = "flex items-center rounded font-medium";

  if (!props.onClick) {
    return (
      <div {...(props as any)} className={clsx(baseStyles, sizeStyles[size], colorStyles[color], className)}>
        {children}
      </div>
    );
  }

  return (
    <button type="button" {...props} className={clsx(baseStyles, sizeStyles[size], colorStyles[color], className)}>
      {children}
    </button>
  );
};
