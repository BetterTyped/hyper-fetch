import type {
  AnyRequestPatch,
  CollectionConfig,
  LoaderConfig,
  RowKey,
  SortDirection,
} from "../collection/collection.types";
import type { DbNotation } from "../db/db.types";
import type { ComparisonNode, ExpressionNode, SendableNode } from "../operators/operators.types";
import { getExpressionFields, splitAnd, stableStringify } from "../operators/operators.utils";
import type { QueryDefinition } from "./query.types";

export type ListPlan = {
  kind: "list";
  loaderIndex: number;
  /** Conditions sent to the backend */
  sent: SendableNode[];
  /** Conditions evaluated on the rows the db holds */
  local: ExpressionNode[];
  /** Whether the query's order is sent to the backend */
  sendOrder: boolean;
  /** Whether the query's limit is sent to the backend */
  sendLimit: boolean;
  paginated: boolean;
  /** Whether the query filters or sorts by a field the backend compares differently, so it is never answered locally */
  serverOnly: boolean;
  subsetId: string;
};

export type OnePlan = { kind: "one"; key: RowKey; loaderIndex: number | undefined };

export type LocalPlan = { kind: "local" };

export type ErrorPlan = { kind: "error"; error: Error };

export type QueryPlan = ListPlan | OnePlan | LocalPlan | ErrorPlan;

export const isPaginatedLoader = (loader: LoaderConfig) => Boolean(loader.cursor || loader.limit);

/**
 * How a loader sends a comparison: its own mapping, the db-wide notation for one declared with `true`, or the loader's
 * adapter notation for any field. `undefined` when it cannot send it.
 */
export const getWhereMapping = (
  loader: LoaderConfig,
  node: SendableNode,
  notation: DbNotation | undefined,
): ((value: unknown) => AnyRequestPatch) | undefined => {
  if (node.op === "server") {
    // Server-only operators have no notation, so the loader maps them itself
    const declaration = (loader.where?.[node.field] as Record<string, unknown> | undefined)?.[node.name];
    return typeof declaration === "function" ? (declaration as (value: unknown) => AnyRequestPatch) : undefined;
  }
  const declaration = loader.where?.[node.field]?.[node.op];
  if (typeof declaration === "function") {
    return declaration as (value: unknown) => AnyRequestPatch;
  }
  const shared = declaration === true ? notation?.where?.[node.op] : loader.notation?.where?.[node.op];
  return shared && ((value) => shared(node.field, value));
};

/** How a loader sends an order, resolved like `getWhereMapping` */
export const getOrderMapping = (
  loader: LoaderConfig,
  field: string,
  notation: DbNotation | undefined,
): ((direction: SortDirection) => AnyRequestPatch) | undefined => {
  const declaration = loader.orderBy?.[field];
  if (typeof declaration === "function") {
    return declaration as (direction: SortDirection) => AnyRequestPatch;
  }
  const shared = declaration === true ? notation?.orderBy : loader.notation?.orderBy;
  return shared && ((direction) => shared(field, direction));
};

/** Whether an expression uses a server-only operator anywhere */
const containsServerNode = (node: ExpressionNode): boolean => {
  if (node.op === "and" || node.op === "or") {
    return node.items.some(containsServerNode);
  }
  if (node.op === "not") {
    return containsServerNode(node.item);
  }
  return node.op === "server";
};

/** Whether a loader can send a condition. `and`, `or` and `not` run on the client. */
export const canSend = (loader: LoaderConfig, node: ExpressionNode, notation: DbNotation | undefined): boolean => {
  if (node.op === "and" || node.op === "or" || node.op === "not") {
    return false;
  }
  return Boolean(getWhereMapping(loader, node, notation));
};

const canSendOrder = (loader: LoaderConfig, field: string, notation: DbNotation | undefined) =>
  Boolean(getOrderMapping(loader, field, notation));

/** Builds the id of the loaded subset that serves a plan, shared by every query with the same backend request */
export const getSubsetId = (
  collectionName: string,
  plan: Omit<ListPlan, "subsetId">,
  definition: QueryDefinition,
): string => {
  const sent = plan.sent.map((node) => stableStringify(node)).toSorted();
  return stableStringify([
    collectionName,
    plan.loaderIndex,
    sent,
    plan.sendOrder ? definition.orderBy : null,
    plan.sendLimit ? definition.limit : null,
  ]);
};

/**
 * Picks how the db serves a query. Among the list loaders whose required filters the query sets, it picks the one that
 * can send the most of the query's top-level conditions; ties go to the loader declared first. A paginated loader is a
 * candidate only when it can send every condition and order, because filtering one page on the client is wrong.
 */
export const planQuery = ({
  collectionName,
  config,
  definition,
  notation,
}: {
  collectionName: string;
  config: CollectionConfig;
  definition: QueryDefinition;
  notation: DbNotation | undefined;
}): QueryPlan => {
  if (definition.one) {
    const index = config.loaders.findIndex((loader) => loader.kind === "byKeys");
    const byKey = config.loaders.findIndex((loader) => loader.kind === "byKey");
    const loaderIndex = index === -1 ? byKey : index;
    const usable = !definition.local && loaderIndex !== -1;
    return { kind: "one", key: definition.one.key, loaderIndex: usable ? loaderIndex : undefined };
  }

  if (definition.local) {
    if (definition.where && containsServerNode(definition.where)) {
      return { kind: "error", error: new Error("A local query cannot use a server-only operator") };
    }
    return { kind: "local" };
  }

  const conditions = splitAnd(definition.where);
  const eqFields = new Set(
    conditions.filter((node): node is ComparisonNode => node.op === "eq").map((node) => node.field),
  );

  let best: Omit<ListPlan, "subsetId"> | undefined;

  config.loaders.forEach((loader, loaderIndex) => {
    if (loader.kind !== "list") {
      return;
    }
    const required = Object.keys(loader.where ?? {}).filter((field) => loader.where?.[field]?.required);
    if (!required.every((field) => eqFields.has(field))) {
      return;
    }
    const sent = conditions.filter((node): node is SendableNode => canSend(loader, node, notation));
    const local = conditions.filter((node) => !canSend(loader, node, notation));
    const ordersSendable = definition.orderBy.every((order) => canSendOrder(loader, order.field, notation));
    const paginated = isPaginatedLoader(loader);
    if (paginated && (local.length > 0 || !ordersSendable)) {
      return;
    }
    // The client cannot evaluate a server-only operator, so a loader that cannot send it cannot serve the query
    if (local.some((node) => containsServerNode(node))) {
      return;
    }
    if (best && best.sent.length >= sent.length) {
      return;
    }
    const serverOnly = new Set(loader.serverOnly);
    const readFields = [
      ...conditions.flatMap((node) => getExpressionFields(node)),
      ...definition.orderBy.map((order) => order.field),
    ];
    best = {
      kind: "list",
      loaderIndex,
      sent,
      local,
      sendOrder: ordersSendable && definition.orderBy.length > 0,
      sendLimit: Boolean(loader.limit && definition.limit !== undefined),
      paginated,
      serverOnly: readFields.some((field) => serverOnly.has(field)) || sent.some((node) => node.op === "server"),
    };
  });

  if (!best) {
    return {
      kind: "error",
      error: new Error(`No loader of "${collectionName}" can serve this query. Set its required filters.`),
    };
  }

  return { ...best, subsetId: getSubsetId(collectionName, best, definition) };
};
