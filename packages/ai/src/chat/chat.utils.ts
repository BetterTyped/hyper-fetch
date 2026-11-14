import type { ChatMessageType, ChatToolPartType } from "./chat.types";

export const isTerminalToolState = (part: ChatToolPartType) =>
  part.state === "output-available" || part.state === "output-error" || part.state === "output-denied";

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
