/**
 * `JSON.stringify` replacer for the keys the hooks build from a request.
 * Adapters with their own serializers accept `BigInt` payloads, which plain JSON can't encode.
 * They are kept in the key and stay distinct from a string with the same digits.
 */
export const keyReplacer = (_key: string, value: unknown) => {
  return typeof value === "bigint" ? { "~bigint": value.toString() } : value;
};
