/** A value type the db stores as tagged JSON, beyond the ones it knows */
export type DbCodec = {
  /** The tag stored with encoded values. It must stay the same across releases. */
  name: string;
  /** Whether a value is of this type */
  test: (value: unknown) => boolean;
  /** Turns a value into one the serializer can store */
  encode: (value: unknown) => unknown;
  /** Turns a stored value back */
  decode: (value: unknown) => unknown;
};

const TAG = "$hf";

type Tagged = { [TAG]: string; v?: unknown };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isTagged = (value: unknown): value is Tagged => isPlainObject(value) && typeof value[TAG] === "string";

/**
 * Stores values as type-tagged JSON, so `Date`, `bigint`, `Map`, `Set`, `undefined`, `NaN` and the infinities come back
 * as they were. Persistence, the outbox and server rendering use it.
 */
export const createSerializer = (codecs: readonly DbCodec[] = []) => {
  const encode = (value: unknown): unknown => {
    const codec = codecs.find((item) => item.test(value));
    if (codec) {
      return { [TAG]: codec.name, v: encode(codec.encode(value)) };
    }
    if (value === undefined) {
      return { [TAG]: "undefined" };
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      return { [TAG]: "number", v: String(value) };
    }
    if (typeof value === "bigint") {
      return { [TAG]: "bigint", v: value.toString() };
    }
    if (value instanceof Date) {
      return { [TAG]: "Date", v: encode(value.getTime()) };
    }
    if (value instanceof Map) {
      return { [TAG]: "Map", v: [...value.entries()].map(([key, item]) => [encode(key), encode(item)]) };
    }
    if (value instanceof Set) {
      return { [TAG]: "Set", v: [...value].map(encode) };
    }
    if (Array.isArray(value)) {
      return value.map(encode);
    }
    if (isPlainObject(value)) {
      const encoded = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]));
      // An object that has the tag's key itself is wrapped, so it is never read as a tagged value
      return TAG in value ? { [TAG]: "object", v: encoded } : encoded;
    }
    return value;
  };

  const decodeEntries = (value: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]));

  const decodeTagged = ({ [TAG]: tag, v }: Tagged): unknown => {
    switch (tag) {
      case "undefined": {
        return undefined;
      }
      case "number": {
        return Number(v);
      }
      case "bigint": {
        return BigInt(v as string);
      }
      case "Date": {
        return new Date(decode(v) as number);
      }
      case "Map": {
        return new Map((v as [unknown, unknown][]).map(([key, item]) => [decode(key), decode(item)]));
      }
      case "Set": {
        return new Set((v as unknown[]).map(decode));
      }
      case "object": {
        return decodeEntries(v as Record<string, unknown>);
      }
      default: {
        const codec = codecs.find((item) => item.name === tag);
        if (!codec) {
          throw new Error(`No codec decodes stored values tagged "${tag}"`);
        }
        return codec.decode(decode(v));
      }
    }
  };

  function decode(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(decode);
    }
    if (isTagged(value)) {
      return decodeTagged(value);
    }
    if (isPlainObject(value)) {
      return decodeEntries(value);
    }
    return value;
  }

  return {
    encode,
    decode,
    stringify: (value: unknown) => JSON.stringify(encode(value)),
    parse: (raw: string) => decode(JSON.parse(raw)),
  };
};

export type Serializer = ReturnType<typeof createSerializer>;
