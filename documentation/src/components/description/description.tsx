export const Description = (
  props: Omit<React.HTMLProps<HTMLParagraphElement>, "size"> & { size?: "none" | "default" | "md" },
) => {
  const { className = "", size = "default" } = props;

  const sizeClass = {
    none: "",
    md: "text-lg",
    default: "text-sm md:text-lg lg:text-xl",
  }[size];

  return (
    <p {...props} className={`${className} ${sizeClass} mt-4 mb-10 font-normal text-slate-600 dark:text-slate-400`} />
  );
};
