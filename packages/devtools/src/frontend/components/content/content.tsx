export const Content = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div className="flex relative flex-1 h-full" {...props}>
      {children}
    </div>
  );
};
