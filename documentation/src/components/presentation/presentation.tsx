import clsx from "clsx";

export const Presentation = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  return (
    <figure
      className={clsx(
        "react-presentation",
        className,
        "min-h-[300px] md:min-h-[350px] max-h-[600px] relative flex justify-center items-center bg-zinc-300/10 dark:bg-zinc-700/10 p-4 border dark:border-zinc-300/10 rounded-3xl",
      )}
    >
      <div className="overflow-hidden rounded-2xl bg-zinc-900 absolute inset-4 shadow-md">
        <img src="/img/background.png" alt="" className="w-full h-full object-cover opacity-90 blur-md" />
      </div>
      <div className="relative z-10">{children}</div>
    </figure>
  );
};
