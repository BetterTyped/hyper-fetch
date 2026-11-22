/** A comparison operator that loaders can map to their backend's notation */
export type ComparisonOperator = "eq" | "gt" | "gte" | "lt" | "lte" | "inArray";

/** Values that `gt`, `gte`, `lt`, `lte` and `orderBy` compare */
export type ComparableValue = string | number | bigint | Date;

/** A node of a filter expression. Operators build it, loaders translate it and the db evaluates it on rows. */
export type ExpressionNode =
  | { readonly op: ComparisonOperator; readonly field: string; readonly value: unknown }
  | { readonly op: "and"; readonly items: readonly ExpressionNode[] }
  | { readonly op: "or"; readonly items: readonly ExpressionNode[] }
  | { readonly op: "not"; readonly item: ExpressionNode }
  | ServerNode;

/** A comparison node, which the db can evaluate on the rows it holds */
export type ComparisonNode = Extract<ExpressionNode, { op: ComparisonOperator }>;

/** A server-only operator, such as full-text search: the loader must send it, and the client never evaluates it */
export type ServerNode = {
  readonly op: "server";
  readonly name: string;
  readonly field: string;
  readonly value: unknown;
};

/** A condition a loader can send to its backend */
export type SendableNode = ComparisonNode | ServerNode;

/**
 * A reference to one row field, received by query callbacks such as `where((post) => eq(post.teamId, 1))`.
 * `Value` is the field's type, so operators accept only values of that type.
 */
export type FieldRef<Name extends string = string, Value = unknown> = {
  readonly kind: "field";
  readonly field: Name;
  /** Type-only marker, never set at runtime */
  readonly __value?: Value;
};

/** The field references a query callback receives, one for every row field */
export type RowRefs<Row> = { readonly [Key in keyof Row & string]-?: FieldRef<Key, Row[Key]> };

/** Marks conditions that never reach a backend, such as `or` and `not` */
export type LocalToken = "~local";

/**
 * A filter condition. `Tokens` lists what it asks a backend for, as `field:operator`, and `Eq` the fields it sets with
 * `eq` at the top level. The types use both to check that a loader can serve the query.
 */
export type Condition<Tokens extends string = string, Eq extends string = string> = {
  readonly kind: "condition";
  readonly node: ExpressionNode;
  /** Type-only marker, never set at runtime */
  readonly __tokens?: Tokens;
  /** Type-only marker, never set at runtime */
  readonly __eq?: Eq;
};

export type ExtractConditionTokens<C> = C extends Condition<infer Tokens, any> ? Tokens : never;

export type ExtractConditionEq<C> = C extends Condition<any, infer Eq> ? Eq : never;

/**
 * Keeps a parameter out of type inference, so the field decides the type and the value is checked against it.
 * TypeScript's own `NoInfer` needs 5.4, and the API docs and older consumers compile with earlier versions.
 */
export type NoInferValue<T> = [T][T extends unknown ? 0 : never];
