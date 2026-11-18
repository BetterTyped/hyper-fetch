import type { ParamsType } from "@hyper-fetch/core";

/**
 * Fills the `:param` segments of a topic template, e.g. `chat/:roomId` + `{ roomId: 1 }` gives `chat/1`.
 *
 * Every `:` segment is replaced once, with the longest matching name. This way `:id` does not eat the beginning
 * of `:idx`, and a value is never parsed again - neither as another param nor as a replacement pattern like `$&`.
 * Segments without a matching param are left untouched.
 */
export const mapTopicParams = (topic: string, params: ParamsType | null | undefined): string => {
  const names = params ? Object.keys(params) : [];
  if (!params || names.length === 0) {
    return topic;
  }

  const [start, ...segments] = topic.split(":");
  const mapped = segments.map((segment) => {
    const name = names.reduce(
      (longest, current) => (segment.startsWith(current) && current.length > longest.length ? current : longest),
      "",
    );
    return name ? `${params[name]}${segment.slice(name.length)}` : `:${segment}`;
  });

  return [start, ...mapped].join("");
};
