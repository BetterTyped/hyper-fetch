import { cn } from "@site/src/lib/utils";

type Token = {
  text: string;
  type?: "keyword" | "type" | "string" | "comment" | "punctuation" | "method" | "property" | "number";
};

type Line = Token[];

const tokenColors: Record<NonNullable<Token["type"]>, string> = {
  keyword: "text-purple-400",
  type: "text-yellow-300",
  string: "text-green-400",
  comment: "text-zinc-500",
  punctuation: "text-zinc-400",
  method: "text-blue-400",
  property: "text-orange-300",
  number: "text-orange-400",
};

export const CodeSnippet = ({ lines, className }: { lines: Line[]; className?: string }) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-[rgba(30,30,30,0.9)] border border-white/10 shadow-lg overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5">
        <div className="size-2.5 rounded-full bg-red-400/80" />
        <div className="size-2.5 rounded-full bg-yellow-400/80" />
        <div className="size-2.5 rounded-full bg-green-400/80" />
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono m-0">
        <code>
          {lines.map((line, i) => (
            <div key={i}>
              {line.length === 0 ? (
                "\n"
              ) : (
                line.map((token, j) => (
                  <span key={j} className={token.type ? tokenColors[token.type] : "text-zinc-300"}>
                    {token.text}
                  </span>
                ))
              )}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};
