import { NoContentIcon } from "frontend/icons/no-content";

export const NoContent = (props: React.HTMLProps<HTMLDivElement> & { text: string }) => {
  const { style, text, ...divProps } = props;

  return (
    <div
      {...divProps}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center w-[300px] mx-auto dark:text-light-100 text-dark-200"
    >
      <NoContentIcon width="50%" height="auto" className="opacity-40" />
      <div className="text-sm font-light text-center">{text}</div>
    </div>
  );
};
