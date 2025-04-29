export const EmptyBox = ({ title }: { title: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50/20 dark:bg-gray-900/40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-500 text-center">
      {title}
    </div>
  );
};
