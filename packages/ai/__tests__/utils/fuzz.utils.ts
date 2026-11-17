import type { JSONPatchOperationType } from "@hyper-fetch/ai";

/**
 * Deterministic pseudo random generator. Fuzz tests must never use `Math.random` - the same seed always
 * produces the same sequence, so a failure can be reproduced from the run number printed in the assertion message.
 */
export const createRandom = (seed: number) => {
  // Park-Miller "minimal standard" generator: every product stays below 2^53, so plain number math is exact
  const modulus = 2_147_483_647;
  let state = (Math.abs(Math.trunc(seed)) % (modulus - 1)) + 1;

  const next = () => {
    state = (state * 48_271) % modulus;
    return (state - 1) / (modulus - 1);
  };
  const int = (max: number) => Math.floor(next() * max);

  return {
    next,
    /** Integer in `[0, max)` */
    int,
    pick: <T>(items: readonly T[]): T => items[int(items.length)],
    chance: (probability: number) => next() < probability,
  };
};

export type RandomType = ReturnType<typeof createRandom>;

export type JSONValueType = null | boolean | number | string | JSONValueType[] | { [key: string]: JSONValueType };

/* -------------------------------------------------------------------------------------------------
 * Random JSON text
 * -----------------------------------------------------------------------------------------------*/

const TEXT_STRINGS = [
  "",
  "a",
  "héllo wörld",
  "😀",
  "👨‍👩‍👧",
  'say "hi"',
  String.raw`back\slash`,
  "\n\t\r\b\f",
  "\u0000\u001F",
  "\u2028\u2029",
  "/",
  "{[]},:",
  "true",
  "null",
  "-12.5e3",
  "日本語",
  " padded ",
  "\uD83D",
];

const TEXT_NUMBERS = [
  "0",
  "-0",
  "1",
  "-1",
  "7",
  "42",
  "12.5",
  "-0.001",
  "1e5",
  "1E5",
  "1e+5",
  "1.5e-10",
  "-2.25E+3",
  "123456789012345678901234567890",
  "0.1",
  "1e308",
  "5e-324",
  "0e0",
  "9007199254740993",
];

const TEXT_WHITESPACE = ["", "", "", "", " ", "\n", "\t", "\r\n", "  ", " \n\t"];

const hex = (code: number, upperCase: boolean) => {
  const digits = code.toString(16).padStart(4, "0");
  return `\\u${upperCase ? digits.toUpperCase() : digits}`;
};

/** Serialize a string as JSON, randomly using `\uXXXX` escapes (also for surrogate pairs) instead of raw characters. */
const stringToJSONText = (random: RandomType, value: string): string => {
  if (random.chance(0.7)) {
    return JSON.stringify(value);
  }
  let text = '"';
  for (let i = 0; i < value.length; i += 1) {
    // UTF-16 code units on purpose: surrogate pairs are escaped as two \\u sequences
    // eslint-disable-next-line unicorn/prefer-code-point
    text += hex(value.charCodeAt(i), random.chance(0.5));
  }
  return `${text}"`;
};

/**
 * Random JSON document as TEXT, so the grammar is covered wider than `JSON.stringify` output: whitespace everywhere,
 * every number form, unicode escapes, empty containers. Keys never repeat inside one object.
 */
export const randomJSONText = (random: RandomType, depth = 0): string => {
  const whitespace = () => random.pick(TEXT_WHITESPACE);
  const roll = random.next();

  if (depth > 3 || roll < 0.35) {
    switch (random.int(5)) {
      case 0: {
        return stringToJSONText(random, random.pick(TEXT_STRINGS));
      }
      case 1: {
        return random.pick(TEXT_NUMBERS);
      }
      case 2: {
        return random.pick(["true", "false", "null"]);
      }
      case 3: {
        return stringToJSONText(random, random.pick(TEXT_STRINGS) + random.pick(TEXT_STRINGS));
      }
      default: {
        return random.pick(TEXT_NUMBERS);
      }
    }
  }

  const size = random.int(4);
  if (roll < 0.67) {
    const items = Array.from(
      { length: size },
      () => `${whitespace()}${randomJSONText(random, depth + 1)}${whitespace()}`,
    );
    return `[${size === 0 ? whitespace() : items.join(",")}]`;
  }

  const members = Array.from({ length: size }, (_, index) => {
    const key = `${random.pick(TEXT_STRINGS)}${index}`;
    const value = randomJSONText(random, depth + 1);
    return `${whitespace()}${stringToJSONText(random, key)}${whitespace()}:${whitespace()}${value}${whitespace()}`;
  });
  return `{${size === 0 ? whitespace() : members.join(",")}}`;
};

/**
 * Random JSON document of a bounded size. Tests that parse every prefix do quadratic work per document, so a rare
 * huge document must not dominate the run time.
 */
export const randomJSONDocument = (random: RandomType, maxLength = 400): string => {
  let text = randomJSONText(random);
  while (text.length > maxLength) {
    text = randomJSONText(random);
  }
  return text;
};

/**
 * Is `partial` what a prefix of the JSON text of `full` may parse to? Arrays must hold a leading part of the items
 * and objects a subset of the members, with everything complete except the value that was being streamed when the
 * text was cut (the "open" one): an open string is a prefix, an open number can be any number (`12` of `123`, `1`
 * of `1e5`). Object members are not compared by position - JavaScript moves integer-like keys to the front.
 */
export const isPartialOf = (partial: unknown, full: unknown, open = true): boolean => {
  if (typeof full === "string") {
    return typeof partial === "string" && (open ? full.startsWith(partial) : full === partial);
  }
  if (typeof full === "number") {
    return typeof partial === "number" && (open || Object.is(full, partial));
  }
  if (full === null || typeof full === "boolean") {
    return partial === full;
  }
  if (Array.isArray(full)) {
    if (!Array.isArray(partial) || partial.length > full.length || (!open && partial.length !== full.length)) {
      return false;
    }
    return partial.every((item, index) => isPartialOf(item, full[index], open && index === partial.length - 1));
  }
  if (typeof full !== "object" || typeof partial !== "object" || partial === null || Array.isArray(partial)) {
    return false;
  }
  const fullObject = full as Record<string, unknown>;
  const partialObject = partial as Record<string, unknown>;
  const partialKeys = Object.keys(partialObject);
  if (!partialKeys.every((key) => Object.hasOwn(fullObject, key))) {
    return false;
  }
  if (!open) {
    return (
      partialKeys.length === Object.keys(fullObject).length &&
      partialKeys.every((key) => isPartialOf(partialObject[key], fullObject[key], false))
    );
  }
  // At most one member may still be open
  const incomplete = partialKeys.filter((key) => !isPartialOf(partialObject[key], fullObject[key], false));
  return (
    incomplete.length === 0 ||
    (incomplete.length === 1 && isPartialOf(partialObject[incomplete[0]], fullObject[incomplete[0]]))
  );
};

/* -------------------------------------------------------------------------------------------------
 * Random JSON values and JSON Patch operations
 * -----------------------------------------------------------------------------------------------*/

/** Small key pool, so random operations hit existing members often. Includes keys that need pointer escaping. */
export const PATCH_KEYS = [
  "a",
  "b",
  "c",
  "",
  "a/b",
  "m~n",
  "~1",
  "0",
  "1",
  "-",
  "length",
  "constructor",
  "prototype",
  " ",
];

const PATCH_LEAVES: JSONValueType[] = [null, true, false, 0, 1, -1.5, "", "text", "żółć 🚀", "0", "-"];

export const randomJSONValue = (random: RandomType, depth = 0): JSONValueType => {
  const roll = random.next();
  if (depth > 3 || roll < 0.4) {
    return random.pick(PATCH_LEAVES);
  }
  const size = random.int(4);
  if (roll < 0.7) {
    return Array.from({ length: size }, () => randomJSONValue(random, depth + 1));
  }
  const result: Record<string, JSONValueType> = {};
  for (let i = 0; i < size; i += 1) {
    result[random.pick(PATCH_KEYS)] = randomJSONValue(random, depth + 1);
  }
  return result;
};

export const encodePointer = (tokens: readonly string[]): string =>
  tokens.map((token) => `/${token.replaceAll("~", "~0").replaceAll("/", "~1")}`).join("");

/** JSON pointers (as token lists) of every value in the document, the root (`[]`) included. */
export const listPointers = (document: unknown, prefix: string[] = []): string[][] => {
  const pointers: string[][] = [prefix];
  if (Array.isArray(document)) {
    document.forEach((item, index) => pointers.push(...listPointers(item, [...prefix, String(index)])));
  } else if (document !== null && typeof document === "object") {
    Object.keys(document).forEach((key) =>
      pointers.push(...listPointers((document as Record<string, unknown>)[key], [...prefix, key])),
    );
  }
  return pointers;
};

const isContainer = (value: unknown): value is object => value !== null && typeof value === "object";

const valueAt = (document: unknown, tokens: readonly string[]): unknown =>
  tokens.reduce<unknown>((current, token) => (current as Record<string, unknown>)[token], document);

/** A target location for `add`: an existing value, a new key in an object or a (maybe out of range) array position. */
const randomTarget = (random: RandomType, document: unknown): string[] => {
  const pointers = listPointers(document);
  const base = random.pick(pointers);
  const value = valueAt(document, base);
  if (random.chance(0.4) || !isContainer(value)) {
    return base;
  }
  if (Array.isArray(value)) {
    return [...base, random.pick(["-", String(value.length), String(random.int(value.length + 1)), "0"])];
  }
  return [...base, random.pick(PATCH_KEYS)];
};

const INVALID_TOKENS = ["missing", "99", "01", "-1", "1.0", "x", "-"];

/** Pointer that mostly does not resolve: a wrong token is appended to (or replaces the end of) a real pointer. */
const randomBrokenPointer = (random: RandomType, document: unknown): string => {
  const base = random.pick(listPointers(document));
  if (random.chance(0.15)) {
    // Not a pointer at all - no leading slash
    return random.pick(["a", "0", " ", "~", "a/b"]);
  }
  return encodePointer([...base.slice(0, random.int(base.length + 1)), random.pick(INVALID_TOKENS)]);
};

/**
 * Random operation for `document`. Most operations are valid for the current document, the rest target missing
 * members, bad array indices or malformed pointers - both sides of the comparison must then reject them.
 */
export const randomOperation = (random: RandomType, document: unknown): JSONPatchOperationType => {
  const existing = () => encodePointer(random.pick(listPointers(document)));
  const target = () => encodePointer(randomTarget(random, document));
  const broken = random.chance(0.12);
  const path = (pointer: () => string) => (broken ? randomBrokenPointer(random, document) : pointer());

  switch (random.int(9)) {
    case 0:
    case 1:
    case 2: {
      return { op: "add", path: path(target), value: randomJSONValue(random, 2) };
    }
    case 3: {
      return { op: "remove", path: path(existing) };
    }
    case 4: {
      return { op: "replace", path: path(existing), value: randomJSONValue(random, 2) };
    }
    case 5: {
      return { op: "move", from: path(existing), path: target() };
    }
    case 6: {
      return { op: "copy", from: path(existing), path: target() };
    }
    case 7: {
      // Passing test: the value currently at the location (as a detached copy)
      const tokens = random.pick(listPointers(document));
      const value = structuredClone(valueAt(document, tokens)) as JSONValueType;
      return { op: "test", path: broken ? randomBrokenPointer(random, document) : encodePointer(tokens), value };
    }
    default: {
      // Test that mostly fails
      return { op: "test", path: path(existing), value: randomJSONValue(random, 2) };
    }
  }
};

/* -------------------------------------------------------------------------------------------------
 * Reference JSON Patch implementation
 * -----------------------------------------------------------------------------------------------*/

export class ReferencePatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferencePatchError";
  }
}

const fail = (message: string): never => {
  throw new ReferencePatchError(message);
};

const decodePointer = (pointer: string): string[] => {
  if (pointer === "") {
    return [];
  }
  if (!pointer.startsWith("/")) {
    return fail(`invalid pointer ${pointer}`);
  }
  return pointer
    .slice(1)
    .split("/")
    .map((token) => token.split("~1").join("/").split("~0").join("~"));
};

const ARRAY_INDEX = /^(?:0|[1-9]\d*)$/;

const step = (container: unknown, token: string): unknown => {
  if (Array.isArray(container)) {
    if (!ARRAY_INDEX.test(token) || Number(token) >= container.length) {
      return fail(`no array element ${token}`);
    }
    return container[Number(token)];
  }
  if (isContainer(container) && Object.hasOwn(container, token)) {
    return (container as Record<string, unknown>)[token];
  }
  return fail(`no member ${token}`);
};

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  if (isContainer(value)) {
    const members = Object.keys(value)
      .toSorted()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`);
    return `{${members.join(",")}}`;
  }
  return JSON.stringify(value);
};

/**
 * Deliberately naive RFC 6902 implementation used as the oracle for the fuzz tests: it deep-clones the document and
 * mutates the clone in place, one operation at a time, following the wording of the RFC. It shares no code with
 * `applyJSONPatch` and does not try to be immutable or fast.
 */
export const referenceApplyPatch = (document: unknown, operations: readonly JSONPatchOperationType[]): unknown => {
  const holder = { root: structuredClone(document) };

  const locate = (tokens: string[]) => {
    const parentTokens = tokens.slice(0, -1);
    const parent = parentTokens.reduce<unknown>(step, holder.root);
    return { parent, token: tokens.at(-1) as string };
  };

  const add = (tokens: string[], value: unknown) => {
    if (tokens.length === 0) {
      holder.root = value;
      return;
    }
    const { parent, token } = locate(tokens);
    if (Array.isArray(parent)) {
      if (token === "-") {
        parent.push(value);
      } else if (ARRAY_INDEX.test(token) && Number(token) <= parent.length) {
        parent.splice(Number(token), 0, value);
      } else {
        fail(`cannot add at array position ${token}`);
      }
    } else if (isContainer(parent)) {
      Object.defineProperty(parent, token, { value, writable: true, enumerable: true, configurable: true });
    } else {
      fail("parent is not a container");
    }
  };

  const remove = (tokens: string[]) => {
    if (tokens.length === 0) {
      fail("cannot remove the root");
    }
    const { parent, token } = locate(tokens);
    step(parent, token);
    if (Array.isArray(parent)) {
      parent.splice(Number(token), 1);
    } else {
      delete (parent as Record<string, unknown>)[token];
    }
  };

  const get = (tokens: string[]) => tokens.reduce<unknown>(step, holder.root);

  operations.forEach((operation) => {
    const path = decodePointer(operation.path);
    switch (operation.op) {
      case "add": {
        add(path, structuredClone(operation.value));
        break;
      }
      case "remove": {
        remove(path);
        break;
      }
      case "replace": {
        get(path);
        if (path.length === 0) {
          holder.root = structuredClone(operation.value);
        } else {
          const { parent, token } = locate(path);
          (parent as Record<string, unknown>)[token] = structuredClone(operation.value);
        }
        break;
      }
      case "move": {
        const from = decodePointer(operation.from);
        if (from.length < path.length && from.every((token, index) => token === path[index])) {
          fail("cannot move a value into one of its children");
        }
        const value = get(from);
        remove(from);
        add(path, value);
        break;
      }
      case "copy": {
        add(path, structuredClone(get(decodePointer(operation.from))));
        break;
      }
      case "test": {
        if (canonical(get(path)) !== canonical(operation.value)) {
          fail("test failed");
        }
        break;
      }
      default: {
        fail("unknown operation");
      }
    }
  });

  return holder.root;
};

/** Recursively freeze a JSON value, so any attempt to mutate it throws (test files are strict mode modules). */
export const deepFreeze = <T>(value: T): T => {
  if (isContainer(value) && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

/** Every object and array inside `value`, the value itself included. */
export const collectContainers = (value: unknown, into = new Set<object>()): Set<object> => {
  if (isContainer(value)) {
    into.add(value);
    Object.values(value).forEach((item) => collectContainers(item, into));
  }
  return into;
};
