import type { ChatMessageType, ChatToolPartType } from "./chat.types";

export const isTerminalToolState = (part: ChatToolPartType) =>
  part.state === "output-available" || part.state === "output-error" || part.state === "output-denied";

/* -------------------------------------------------------------------------------------------------
 * Messages snapshots
 * -----------------------------------------------------------------------------------------------*/

const getPartKeys = (message: ChatMessageType<any>): Set<string> =>
  new Set(
    message.parts.flatMap((part) => {
      if (part.type === "tool") {
        return [`tool:${part.toolCallId}`];
      }
      if (part.type === "text" || part.type === "reasoning") {
        return [`${part.type}:${part.id}`];
      }
      return [];
    }),
  );

/** Take finished tool results from the snapshot, keep everything else the client already has. */
const mergeSnapshotMessage = <M extends ChatMessageType<any>>(current: M, snapshot: M): M => {
  const snapshotTools = new Map(
    snapshot.parts
      .filter((part): part is ChatToolPartType => part.type === "tool")
      .map((part) => [part.toolCallId, part] as const),
  );
  let changed = false;
  const parts = current.parts.map((part) => {
    if (part.type !== "tool") {
      return part;
    }
    const fromSnapshot = snapshotTools.get(part.toolCallId);
    if (!fromSnapshot || isTerminalToolState(part) || !isTerminalToolState(fromSnapshot)) {
      return part;
    }
    changed = true;
    return { ...fromSnapshot, ...(part.interruptId !== undefined && { interruptId: part.interruptId }) };
  });
  return changed ? ({ ...current, parts } as M) : current;
};

/**
 * Reconcile a full history sent by the backend (AG-UI `MESSAGES_SNAPSHOT`) with the client's messages. The snapshot
 * decides which messages exist and their order, but messages the client already has - matched by id, or for assistant
 * messages by a shared tool call or text id - keep their client state (ids, client tool results, interrupt bindings).
 */
export const reconcileMessagesSnapshot = <M extends ChatMessageType<any>>(snapshot: M[], current: M[]): M[] => {
  const used = new Set<M>();
  return snapshot.map((message) => {
    let match = current.find((item) => !used.has(item) && item.id === message.id);
    if (!match && message.role === "assistant") {
      const keys = getPartKeys(message);
      match = current.find(
        (item) => !used.has(item) && item.role === "assistant" && [...getPartKeys(item)].some((key) => keys.has(key)),
      );
    }
    if (!match) {
      return message;
    }
    used.add(match);
    return mergeSnapshotMessage(match, message);
  });
};

/* -------------------------------------------------------------------------------------------------
 * Helpers for `sendAutomaticallyWhen`
 * -----------------------------------------------------------------------------------------------*/

const getLastStepToolParts = (messages: ChatMessageType<any>[]): ChatToolPartType[] | null => {
  const message = messages[messages.length - 1];
  if (message?.role !== "assistant") {
    return null;
  }
  let stepStart = -1;
  message.parts.forEach((part, index) => {
    if (part.type === "step-start") {
      stepStart = index;
    }
  });
  return message.parts
    .slice(stepStart + 1)
    .filter((part): part is ChatToolPartType => part.type === "tool" && !part.providerExecuted);
};

/** True when the last assistant message has tool calls and every one of them has a result. */
export const lastAssistantMessageIsCompleteWithToolCalls = ({ messages }: { messages: ChatMessageType<any>[] }) => {
  const parts = getLastStepToolParts(messages);
  return !!parts && parts.length > 0 && parts.every(isTerminalToolState);
};

/** True when the last assistant message has approval requests and every one of them was answered. */
export const lastAssistantMessageIsCompleteWithApprovalResponses = ({
  messages,
}: {
  messages: ChatMessageType<any>[];
}) => {
  const parts = getLastStepToolParts(messages);
  if (!parts) {
    return false;
  }
  const withApproval = parts.filter((part) => "approval" in part && part.approval);
  return (
    withApproval.some((part) => part.state === "approval-responded") &&
    parts.every((part) => part.state !== "approval-requested" && part.state !== "input-available")
  );
};
