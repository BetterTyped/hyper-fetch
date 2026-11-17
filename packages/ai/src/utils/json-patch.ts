/** RFC 6902 JSON Patch operation, as used by AG-UI `STATE_DELTA` and `ACTIVITY_DELTA` events. */
export type JSONPatchOperationType =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown }
  | { op: "move"; path: string; from: string }
  | { op: "copy"; path: string; from: string }
  | { op: "test"; path: string; value: unknown };

export class JSONPatchError extends Error {
  readonly operation: JSONPatchOperationType;

  constructor(message: string, operation: JSONPatchOperationType) {
    super(`${message} (${operation.op} ${operation.path})`);
    this.name = "JSONPatchError";
    this.operation = operation;
  }
}

const parsePointer = (pointer: string, operation: JSONPatchOperationType): string[] => {
  if (pointer === "") {
    return [];
  }
  // Operations come from the wire - a missing or non-string pointer must fail like any other invalid patch
  if (typeof pointer !== "string" || !pointer.startsWith("/")) {
    throw new JSONPatchError(`Invalid JSON pointer "${pointer}"`, operation);
  }
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    // Own members only - `key in b` would also find `__proto__`, `constructor` and other inherited names
    return (
      keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
    );
  }
  return false;
};

const getArrayIndex = ({
  segment,
  length,
  allowEnd,
  operation,
}: {
  segment: string;
  length: number;
  allowEnd: boolean;
  operation: JSONPatchOperationType;
}) => {
  if (segment === "-" && allowEnd) {
    return length;
  }
  if (!/^(0|[1-9]\d*)$/.test(segment)) {
    throw new JSONPatchError(`Invalid array index "${segment}"`, operation);
  }
  const index = Number(segment);
  if (index > length || (!allowEnd && index === length)) {
    throw new JSONPatchError(`Array index ${index} out of bounds`, operation);
  }
  return index;
};

const getValue = (document: unknown, path: string[], operation: JSONPatchOperationType): unknown => {
  let current = document;
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[getArrayIndex({ segment, length: current.length, allowEnd: false, operation })];
    } else if (isPlainObject(current) && Object.hasOwn(current, segment)) {
      current = current[segment];
    } else {
      throw new JSONPatchError(`Path not found`, operation);
    }
  }
  return current;
};

/** Immutably set (`add`/`replace`) or delete the value at `path`, copying only the containers along the way. */
type UpdateActionType = { kind: "add" | "replace"; value: unknown } | { kind: "remove" };

const update = (
  document: unknown,
  path: string[],
  { operation, action }: { operation: JSONPatchOperationType; action: UpdateActionType },
): unknown => {
  if (path.length === 0) {
    if (action.kind === "remove") {
      throw new JSONPatchError("Cannot remove the document root", operation);
    }
    return action.value;
  }

  const [segment, ...rest] = path;

  if (Array.isArray(document)) {
    const copy = [...document];
    if (rest.length > 0) {
      const index = getArrayIndex({ segment, length: copy.length, allowEnd: false, operation });
      copy[index] = update(copy[index], rest, { operation, action });
      return copy;
    }
    if (action.kind === "add") {
      copy.splice(getArrayIndex({ segment, length: copy.length, allowEnd: true, operation }), 0, action.value);
    } else if (action.kind === "replace") {
      copy[getArrayIndex({ segment, length: copy.length, allowEnd: false, operation })] = action.value;
    } else {
      copy.splice(getArrayIndex({ segment, length: copy.length, allowEnd: false, operation }), 1);
    }
    return copy;
  }

  if (!isPlainObject(document)) {
    throw new JSONPatchError("Path not found", operation);
  }

  const copy: Record<string, unknown> = { ...document };
  if (rest.length > 0) {
    if (!Object.hasOwn(copy, segment)) {
      throw new JSONPatchError("Path not found", operation);
    }
    copy[segment] = update(copy[segment], rest, { operation, action });
    return copy;
  }
  if (action.kind !== "add" && !Object.hasOwn(copy, segment)) {
    throw new JSONPatchError("Path not found", operation);
  }
  if (action.kind === "remove") {
    delete copy[segment];
  } else if (segment === "__proto__") {
    // Assigning `copy.__proto__` would replace the prototype instead of creating the member, like JSON.parse does
    Object.defineProperty(copy, segment, { value: action.value, writable: true, enumerable: true, configurable: true });
  } else {
    copy[segment] = action.value;
  }
  return copy;
};

/** RFC 6902: `add`, `replace` and `test` operations MUST contain a "value" member. */
const getOperationValue = (operation: Extract<JSONPatchOperationType, { value: unknown }>): unknown => {
  if (!("value" in operation)) {
    throw new JSONPatchError('Missing "value"', operation);
  }
  return operation.value;
};

const isProperPrefix = (prefix: string[], path: string[]) =>
  prefix.length < path.length && prefix.every((segment, index) => segment === path[index]);

/**
 * Apply RFC 6902 JSON Patch operations without mutating the input. Unchanged branches keep their identity, so React
 * components reading untouched parts of the state don't re-render.
 */
export const applyJSONPatch = <T = unknown>(document: unknown, operations: readonly JSONPatchOperationType[]): T => {
  let result = document;
  for (const operation of operations) {
    const path = parsePointer(operation.path, operation);
    switch (operation.op) {
      case "add":
      case "replace": {
        const value = getOperationValue(operation);
        result = update(result, path, { operation, action: { kind: operation.op, value } });
        break;
      }
      case "remove": {
        result = update(result, path, { operation, action: { kind: "remove" } });
        break;
      }
      case "move": {
        const from = parsePointer(operation.from, operation);
        if (isProperPrefix(from, path)) {
          // RFC 6902 4.4. Without this check, removing an array element first would shift its sibling into the
          // target location and the value would silently end up inside that sibling.
          throw new JSONPatchError("Cannot move a value into one of its children", operation);
        }
        const value = getValue(result, from, operation);
        result = update(result, from, { operation, action: { kind: "remove" } });
        result = update(result, path, { operation, action: { kind: "add", value } });
        break;
      }
      case "copy": {
        const value = getValue(result, parsePointer(operation.from, operation), operation);
        result = update(result, path, { operation, action: { kind: "add", value: structuredClone(value) } });
        break;
      }
      case "test": {
        if (!deepEqual(getValue(result, path, operation), getOperationValue(operation))) {
          throw new JSONPatchError("Test failed", operation);
        }
        break;
      }
      default: {
        throw new JSONPatchError("Unknown operation", operation);
      }
    }
  }
  return result as T;
};
