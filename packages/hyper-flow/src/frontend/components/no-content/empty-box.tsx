export const EmptyBox = ({ title }: { title: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-50/20 dark:bg-zinc-900/40 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-500 dark:text-zinc-500 text-center">
      {title}
    </div>
  );
};
