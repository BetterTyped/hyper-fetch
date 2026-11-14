export type PartialJSONParseStateType = "undefined-input" | "successful-parse" | "repaired-parse" | "failed-parse";

export type PartialJSONParseResultType<T = unknown> = {
  value: T | undefined;
  state: PartialJSONParseStateType;
};

type Frame = {
  type: "object" | "array";
  expect: "key-or-end" | "key" | "colon" | "value" | "value-or-end" | "comma";
};

const LITERALS = ["true", "false", "null"];

const isDigit = (char: string) => char >= "0" && char <= "9";
const isHex = (char: string) => /^[0-9a-fA-F]$/.test(char);
const isWhitespace = (char: string) => char === " " || char === "\n" || char === "\r" || char === "\t";

/**
 * Turn a prefix of a JSON document (e.g. tokens streamed by an LLM) into valid JSON:
 * - open strings are closed (`{"a":"hel` -> `{"a":"hel"}`)
 * - open objects and arrays are closed
 * - dangling keys, colons, commas and unfinished numbers or escapes are dropped (`{"a":1,"b` -> `{"a":1}`)
 * - partial literals are completed (`[tr` -> `[true]`)
 *
 * Returns the input unchanged when it is not a JSON prefix at all - `JSON.parse` will then fail on it.
 */
export const repairPartialJSON = (text: string): string => {
  const stack: Frame[] = [];
  let rootDone = false;
  let lastValid = 0;

  let mode: "none" | "string" | "escape" | "unicode" | "number" | "literal" = "none";
  let stringIsKey = false;
  let unicodeCount = 0;
  let literal = "";
  let literalStart = 0;

  const top = (): Frame | undefined => stack[stack.length - 1];

  const isExpectingValue = () => {
    const frame = top();
    if (!frame) {
      return !rootDone;
    }
    return frame.expect === "value" || frame.expect === "value-or-end";
  };

  const valueComplete = () => {
    const frame = top();
    if (frame) {
      frame.expect = "comma";
    } else {
      rootDone = true;
    }
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (mode === "string") {
      if (char === "\\") {
        mode = "escape";
      } else if (char === '"') {
        mode = "none";
        if (stringIsKey) {
          (top() as Frame).expect = "colon";
        } else {
          valueComplete();
          lastValid = i + 1;
        }
      } else if (!stringIsKey) {
        lastValid = i + 1;
      }
      continue;
    }

    if (mode === "escape") {
      if (char === "u") {
        mode = "unicode";
        unicodeCount = 0;
      } else {
        mode = "string";
        if (!stringIsKey) {
          lastValid = i + 1;
        }
      }
      continue;
    }

    if (mode === "unicode") {
      if (!isHex(char)) {
        return text;
      }
      unicodeCount += 1;
      if (unicodeCount === 4) {
        mode = "string";
        if (!stringIsKey) {
          lastValid = i + 1;
        }
      }
      continue;
    }

    if (mode === "number") {
      if (isDigit(char)) {
        lastValid = i + 1;
        continue;
      }
      if (char === "." || char === "e" || char === "E" || char === "+" || char === "-") {
        continue;
      }
      mode = "none";
      valueComplete();
      // fall through to handle this char as structure
    }

    if (mode === "literal") {
      const next = literal + char;
      if (LITERALS.some((value) => value.startsWith(next))) {
        literal = next;
        if (LITERALS.includes(literal)) {
          mode = "none";
          valueComplete();
          lastValid = i + 1;
        }
        continue;
      }
      return text;
    }

    if (isWhitespace(char)) {
      continue;
    }

    const frame = top();

    if (isExpectingValue()) {
      if (char === "{") {
        stack.push({ type: "object", expect: "key-or-end" });
        lastValid = i + 1;
        continue;
      }
      if (char === "[") {
        stack.push({ type: "array", expect: "value-or-end" });
        lastValid = i + 1;
        continue;
      }
      if (char === '"') {
        mode = "string";
        stringIsKey = false;
        lastValid = i + 1;
        continue;
      }
      if (char === "-" || isDigit(char)) {
        mode = "number";
        if (isDigit(char)) {
          lastValid = i + 1;
        }
        continue;
      }
      if (char === "t" || char === "f" || char === "n") {
        mode = "literal";
        literal = char;
        literalStart = i;
        continue;
      }
      if (char === "]" && frame?.type === "array" && frame.expect === "value-or-end") {
        stack.pop();
        valueComplete();
        lastValid = i + 1;
        continue;
      }
      return text;
    }

    if (!frame) {
      // Something after a complete root value
      return text;
    }

    if (frame.type === "object") {
      if ((frame.expect === "key-or-end" || frame.expect === "key") && char === '"') {
        mode = "string";
        stringIsKey = true;
        continue;
      }
      if ((frame.expect === "key-or-end" || frame.expect === "comma") && char === "}") {
        stack.pop();
        valueComplete();
        lastValid = i + 1;
        continue;
      }
      if (frame.expect === "colon" && char === ":") {
        frame.expect = "value";
        continue;
      }
      if (frame.expect === "comma" && char === ",") {
        frame.expect = "key";
        continue;
      }
      return text;
    }

    if (frame.expect === "comma" && char === ",") {
      frame.expect = "value";
      continue;
    }
    if (frame.expect === "comma" && char === "]") {
      stack.pop();
      valueComplete();
      lastValid = i + 1;
      continue;
    }
    return text;
  }

  let result: string;
  let closers = stack;

  if (mode === "literal") {
    // A partial literal in a value position is completed, so everything before it is kept
    const full = LITERALS.find((value) => value.startsWith(literal)) as string;
    result = text.slice(0, literalStart) + full;
  } else if ((mode === "string" || mode === "escape" || mode === "unicode") && !stringIsKey) {
    result = `${text.slice(0, lastValid)}"`;
  } else {
    result = text.slice(0, lastValid);
    if (!result.trim()) {
      closers = [];
    }
  }

  for (let i = closers.length - 1; i >= 0; i -= 1) {
    result += closers[i].type === "object" ? "}" : "]";
  }

  return result;
};

/**
 * Parse possibly incomplete JSON. Complete documents parse as `successful-parse`, valid prefixes are repaired with
 * {@link repairPartialJSON} and parse as `repaired-parse`.
 */
export const parsePartialJSON = <T = unknown>(text: string | undefined | null): PartialJSONParseResultType<T> => {
  if (text === undefined || text === null) {
    return { value: undefined, state: "undefined-input" };
  }

  try {
    return { value: JSON.parse(text) as T, state: "successful-parse" };
  } catch {
    // continue with repair
  }

  const repaired = repairPartialJSON(text);
  if (!repaired.trim()) {
    return { value: undefined, state: "failed-parse" };
  }

  try {
    return { value: JSON.parse(repaired) as T, state: "repaired-parse" };
  } catch {
    return { value: undefined, state: "failed-parse" };
  }
};
