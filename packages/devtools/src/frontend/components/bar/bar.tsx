export const Bar = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className={`flex flex-wrap items-center justify-between gap-[5px] border-b p-1 dark:border-dark-400 border-light-400 dark:bg-dark-700 bg-light-100 ${className || ""}`}
    >
      {children}
    </div>
  );
};
