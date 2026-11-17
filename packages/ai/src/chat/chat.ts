import type { RequestInstance, StreamParserType } from "@hyper-fetch/core";

import type { ChatRequestTriggerType, ChatResumeEntryType } from "../protocols/protocol.types";
import { validateSchema } from "../schema/standard-schema";
import type { StandardSchemaV1 } from "../schema/standard-schema.types";
import { generateId as defaultGenerateId } from "../utils/id";
import { applyJSONPatch } from "../utils/json-patch";
import { cancelRequest } from "../utils/request";
import {
  collectResumeEntries,
  addUsage,
  findLastIndexById,
  findLastToolPart,
  findToolCallIdByApproval,
  getClientToolDefinitions,
  validateSync,
} from "./chat.internal";
import { ChatMessageBuilder } from "./chat.message-builder";
import type {
  ChatClientToolType,
  ChatErrorType,
  ChatOptionsType,
  ChatRequestOptionsType,
  ChatSendMessageType,
  ChatSnapshotType,
} from "./chat.options";
import { ChatStreamError } from "./chat.options";
import type {
  ChatDataEventType,
  ChatFinishReasonType,
  ChatMessageType,
  ChatStateType,
  ChatStreamEventType,
  ChatToolCallType,
  ChatToolPartType,
  ChatToolResultType,
  ChatTypes,
  ChatUsageType,
} from "./chat.types";
import { isTerminalToolState, reconcileMessagesSnapshot } from "./chat.utils";

type ActiveRequestType = {
  runId: string;
  requestId: string | null;
  request: RequestInstance;
  aborted: boolean;
};

/* -------------------------------------------------------------------------------------------------
 * Chat
 * -----------------------------------------------------------------------------------------------*/

/**
 * Framework-agnostic chat store. It keeps the messages, sends them through a HyperFetch request and decodes the
 * streamed answer with the configured protocol. Subscribe with `subscribe` + `getSnapshot` (React: `useChat`).
 */
export class Chat<T extends ChatTypes = ChatTypes, R extends RequestInstance = RequestInstance> {
  readonly id: string;

  private options: ChatOptionsType<T, R>;
  private snapshot: ChatSnapshotType<T, R>;
  private listeners = new Set<() => void>();
  private active: ActiveRequestType | null = null;
  /** Resolves when the current request has finished */
  private settled: Promise<void> | null = null;
  private lastRunId: string | undefined;
  private pendingResume: ChatResumeEntryType[] = [];
  private sentInterrupts = new Set<string>();
  private automaticSends = 0;
  private pendingToolExecutions = new Set<Promise<void>>();
  /** The assistant message being streamed right now */
  private building: { builder: ChatMessageBuilder; commit: () => void } | null = null;

  constructor(options: ChatOptionsType<T, R>) {
    this.options = options;
    this.id = options.id ?? this.generateId();
    this.snapshot = {
      id: this.id,
      messages: options.messages ?? [],
      status: "ready",
      error: undefined,
      state: options.state,
      interrupts: [],
      usage: undefined,
    };
  }

  /* ----------------------------------------------------------------------------------------------
   * Store
   * --------------------------------------------------------------------------------------------*/

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ChatSnapshotType<T, R> => this.snapshot;

  get messages() {
    return this.snapshot.messages;
  }

  get status() {
    return this.snapshot.status;
  }

  get error() {
    return this.snapshot.error;
  }

  get state() {
    return this.snapshot.state;
  }

  /** Update options (callbacks, body, tools...) without recreating the chat - used by `useChat` on every render. */
  setOptions = (options: Partial<ChatOptionsType<T, R>>) => {
    this.options = { ...this.options, ...options };
  };

  private update(patch: Partial<ChatSnapshotType<T, R>>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private generateId() {
    return this.options.generateId?.() ?? defaultGenerateId();
  }

  /* ----------------------------------------------------------------------------------------------
   * Public API
   * --------------------------------------------------------------------------------------------*/

  /**
   * Add a user message and request an answer. Without a message, it only requests an answer (e.g. after adding tool
   * results). Ignored while a request is in progress - check `status` or call `stop()` first. Right after `stop()` it
   * waits for the stopped request to finish and then sends.
   */
  sendMessage = async (message?: ChatSendMessageType<T>, options?: ChatRequestOptionsType): Promise<void> => {
    if (this.isBusy()) {
      await this.waitForStop();
      // Still busy: a request is really in progress, or another call started one first
      if (this.isBusy()) {
        return;
      }
    }
    // A user action resets the automatic request limit
    this.automaticSends = 0;

    if (message !== undefined) {
      const userMessage: ChatMessageType<T> =
        typeof message === "string"
          ? {
              id: this.generateId(),
              role: "user",
              parts: [{ type: "text", id: this.generateId(), text: message, state: "done" }],
            }
          : {
              id: message.id ?? this.generateId(),
              role: "user",
              ...(message.metadata !== undefined && { metadata: message.metadata }),
              parts: [
                ...(message.text !== undefined
                  ? [{ type: "text" as const, id: this.generateId(), text: message.text, state: "done" as const }]
                  : []),
                ...(message.parts ?? []),
              ],
            };
      this.update({ messages: [...this.snapshot.messages, userMessage] });
    }

    await this.makeRequest("submit-message", options);
  };

  /**
   * Request a new answer for the last message - or for `messageId`. An assistant message is dropped together with
   * everything after it and generated again; a user message is kept and answered again (e.g. after a failed request).
   */
  regenerate = async (options?: ChatRequestOptionsType & { messageId?: string }): Promise<void> => {
    if (this.isBusy()) {
      await this.waitForStop();
      // Still busy: a request is really in progress, or another call started one first
      if (this.isBusy()) {
        return;
      }
    }
    const { messages } = this.snapshot;
    const index = options?.messageId
      ? messages.findIndex((message) => message.id === options.messageId)
      : messages.length - 1;
    if (index === -1) {
      return;
    }
    // A user action resets the automatic request limit
    this.automaticSends = 0;

    const target = messages[index];
    const keep = target.role === "assistant" ? messages.slice(0, index) : messages.slice(0, index + 1);
    this.update({ messages: keep });
    await this.makeRequest("regenerate-message", { ...options, messageId: target.id });
  };

  /** Reconnect to a stream that is still running on the server (requires `resumeRequest`). */
  resumeStream = async (options?: ChatRequestOptionsType): Promise<void> => {
    if (this.isBusy()) {
      await this.waitForStop();
      // Still busy: a request is really in progress, or another call started one first
      if (this.isBusy()) {
        return;
      }
    }
    if (!this.options.resumeRequest) {
      throw new Error("resumeStream() requires the `resumeRequest` chat option");
    }
    await this.makeRequest("resume-stream", options);
  };

  /**
   * Abort the current request - also one that is still waiting for the network or for a retry. The partial answer is
   * kept.
   */
  stop = () => {
    const { active } = this;
    if (!active) {
      return;
    }
    active.aborted = true;
    if (active.requestId) {
      cancelRequest(active.request, active.requestId);
    }
  };

  setMessages = (messages: ChatMessageType<T>[] | ((messages: ChatMessageType<T>[]) => ChatMessageType<T>[])) => {
    this.update({ messages: typeof messages === "function" ? messages(this.snapshot.messages) : messages });
  };

  /** Replace the shared agent state (sent with the next request by AG-UI protocols) */
  setState = (state: ChatStateType<T> | ((state: ChatStateType<T> | undefined) => ChatStateType<T>)) => {
    this.update({
      state:
        typeof state === "function"
          ? (state as (current: ChatStateType<T> | undefined) => ChatStateType<T>)(this.snapshot.state)
          : state,
    });
  };

  clearError = () => {
    if (this.snapshot.status === "error") {
      this.update({ status: "ready", error: undefined });
    }
  };

  /** Provide the result of a client-side tool call. Typed by tool name. */
  addToolResult = (result: ChatToolResultType<T>) => {
    this.applyToolResult(result);
    this.maybeSendAutomatically();
  };

  /** Answer a tool approval request. */
  addToolApprovalResponse = ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
    const toolCallId = findToolCallIdByApproval(this.snapshot.messages, id);
    if (!toolCallId) {
      return;
    }
    this.applyToToolMessage(toolCallId, {
      type: "tool-approval-response",
      approvalId: id,
      approved,
      ...(reason !== undefined && { reason }),
    });
    this.maybeSendAutomatically();
  };

  /**
   * Answer a generic backend interrupt (AG-UI `RUN_FINISHED` with an interrupt outcome). The answer is sent with the
   * next request - call `sendMessage()` to continue the run.
   */
  resolveInterrupt = ({
    interruptId,
    status = "resolved",
    payload,
  }: {
    interruptId: string;
    status?: "resolved" | "cancelled";
    payload?: unknown;
  }) => {
    this.pendingResume.push({ interruptId, status, ...(payload !== undefined && { payload }) });
    this.update({ interrupts: this.snapshot.interrupts.filter((interrupt) => interrupt.id !== interruptId) });
  };

  /* ----------------------------------------------------------------------------------------------
   * Internals
   * --------------------------------------------------------------------------------------------*/

  private isBusy() {
    return this.snapshot.status === "submitted" || this.snapshot.status === "streaming";
  }

  /**
   * `stop()` is synchronous, but the stopped request needs a moment to wind down. Wait for it, so `stop()` followed
   * by `sendMessage()` works. Returns right away when the request in progress was not stopped.
   */
  private async waitForStop(): Promise<void> {
    while (this.isBusy() && this.active?.aborted && this.settled) {
      // eslint-disable-next-line no-await-in-loop
      await this.settled;
    }
  }

  private applyToolResult(result: ChatToolResultType<T>) {
    const event: ChatStreamEventType =
      "output" in result
        ? { type: "tool-output-available", toolCallId: result.toolCallId, output: result.output }
        : { type: "tool-output-error", toolCallId: result.toolCallId, errorText: result.errorText };

    this.applyToToolMessage(result.toolCallId, event);
  }

  /** Apply an event to whichever message holds the tool call. Returns the updated tool part. */
  private applyToToolMessage(toolCallId: string, event: ChatStreamEventType): ChatToolPartType | undefined {
    const { messages } = this.snapshot;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const hasTool = messages[i].parts.some((part) => part.type === "tool" && part.toolCallId === toolCallId);
      if (hasTool) {
        let builder: ChatMessageBuilder;
        // The message is still streaming - go through its builder so the next event doesn't overwrite the result
        if (this.building && this.building.builder.message.id === messages[i].id) {
          ({ builder } = this.building);
          builder.apply(event);
          this.building.commit();
        } else {
          builder = new ChatMessageBuilder(messages[i] as ChatMessageType);
          builder.apply(event);
          const next = [...messages];
          next[i] = builder.message as ChatMessageType<T>;
          this.update({ messages: next });
        }
        return builder.message.parts.find(
          (part) => part.type === "tool" && part.toolCallId === toolCallId,
        ) as ChatToolPartType;
      }
    }
    return undefined;
  }

  private getBody(extra?: Record<string, unknown>) {
    const { body } = this.options;
    return { ...(typeof body === "function" ? body() : body), ...extra };
  }

  private maybeSendAutomatically() {
    if (this.isBusy() || this.pendingToolExecutions.size > 0) {
      return;
    }
    const { sendAutomaticallyWhen, maxAutomaticSends = 20 } = this.options;
    if (!sendAutomaticallyWhen?.({ messages: this.snapshot.messages })) {
      return;
    }
    if (this.automaticSends >= maxAutomaticSends) {
      return;
    }
    this.automaticSends += 1;
    this.makeRequest("submit-message");
  }

  private runClientTool(toolCall: ChatToolCallType<T>, run: ActiveRequestType) {
    const tools = (this.options.tools ?? {}) as Record<string, ChatClientToolType<unknown, unknown> | undefined>;
    const tool = tools[toolCall.toolName];
    const onToolCall = this.options.onToolCall;

    const execution = (async () => {
      try {
        await onToolCall?.(toolCall);
        if (!tool?.execute) {
          return;
        }

        let { input } = toolCall as { input: unknown };
        if (tool.inputSchema) {
          const validation = await validateSchema(tool.inputSchema, input, `Tool "${toolCall.toolName}" input`);
          if (!validation.success) {
            throw validation.error;
          }
          input = validation.value;
        }
        const output = await tool.execute(input, { toolCallId: toolCall.toolCallId });
        this.addToolResultUnchecked(toolCall.toolCallId, { output });
      } catch (error) {
        this.addToolResultUnchecked(toolCall.toolCallId, {
          errorText: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    this.pendingToolExecutions.add(execution);
    execution.finally(() => {
      this.pendingToolExecutions.delete(execution);
      // The result is kept, but a request stopped by the user must not continue on its own
      if (!run.aborted) {
        this.maybeSendAutomatically();
      }
    });
  }

  private addToolResultUnchecked(toolCallId: string, result: { output: unknown } | { errorText: string }) {
    // The latest call wins - some providers reuse tool call ids in every step
    const tool = findLastToolPart(this.snapshot.messages, toolCallId);
    // Don't overwrite a result that is already there (e.g. the user answered manually)
    if (!tool || isTerminalToolState(tool)) {
      return;
    }
    this.applyToolResult({ tool: tool.toolName, toolCallId, ...result } as ChatToolResultType<T>);
  }

  private resolveRequest(trigger: ChatRequestTriggerType): RequestInstance {
    if (trigger === "resume-stream") {
      const { resumeRequest } = this.options;
      return typeof resumeRequest === "function" ? resumeRequest(this.id) : (resumeRequest as RequestInstance);
    }
    return this.options.request;
  }

  private async makeRequest(
    trigger: ChatRequestTriggerType,
    options?: ChatRequestOptionsType & { messageId?: string },
  ) {
    const { protocol } = this.options;
    let settle = () => {};
    const settled = new Promise<void>((resolve) => {
      settle = resolve;
    });
    this.settled = settled;
    const runId = this.generateId();
    const parentRunId = this.lastRunId;
    this.lastRunId = runId;

    const resume = [...this.pendingResume, ...collectResumeEntries(this.snapshot.messages, this.sentInterrupts)];
    this.pendingResume = [];

    const baseMessages = this.snapshot.messages;
    const baseState = this.snapshot.state;
    const lastMessage = baseMessages[baseMessages.length - 1];
    // After tool results the backend continues the same assistant message
    const continues = lastMessage?.role === "assistant" && trigger !== "regenerate-message";

    const building = {
      builder: new ChatMessageBuilder(
        continues ? (lastMessage as ChatMessageType) : { id: this.generateId(), role: "assistant", parts: [] },
      ),
      commit: () => {},
    };
    const baseAssistant = building.builder.message;
    // Id under which the assistant message sits in `messages`, null until the first event attaches it. The message
    // is looked up by id on every change, because the list may be edited with `setMessages()` while it streams.
    let attachedId: string | null = continues ? baseAssistant.id : null;
    // Removed with `setMessages()` while it was streaming - it must not come back
    let removed = false;
    let receivedEvents = false;
    let finishReason: ChatFinishReasonType | undefined;
    let usage: ChatUsageType | undefined;
    let streamError: ChatErrorType<R> | undefined;
    let serverAborted = false;

    this.update({ status: "submitted", error: undefined, usage: undefined, interrupts: [] });

    const commitMessage = () => {
      if (removed) {
        return;
      }
      const next = building.builder.message as ChatMessageType<T>;
      const messages = [...this.snapshot.messages];
      if (attachedId === null) {
        messages.push(next);
      } else {
        const index = findLastIndexById(messages, attachedId);
        if (index === -1) {
          removed = true;
          return;
        }
        messages[index] = next;
      }
      attachedId = next.id;
      this.update({ messages });
    };
    building.commit = commitMessage;

    const handleEvent = (event: ChatStreamEventType) => {
      if (!this.active || this.active.runId !== runId || this.active.aborted) {
        return;
      }
      receivedEvents = true;
      this.options.onEvent?.(event);

      if (this.snapshot.status === "submitted") {
        this.update({ status: "streaming" });
      }

      switch (event.type) {
        case "state-snapshot": {
          this.update({ state: event.state as ChatStateType<T> });
          return;
        }
        case "state-delta": {
          try {
            this.update({ state: applyJSONPatch<ChatStateType<T>>(this.snapshot.state ?? {}, event.patch) });
          } catch (error) {
            streamError = error as Error;
          }
          return;
        }
        case "messages-snapshot": {
          const messages = reconcileMessagesSnapshot(event.messages as ChatMessageType<T>[], this.snapshot.messages);
          const { id } = building.builder.message;
          const index = messages.findIndex((message) => message.id === id);
          if (index !== -1) {
            building.builder.rebase(messages[index] as ChatMessageType);
            attachedId = id;
            removed = false;
          } else if (attachedId !== null && !removed) {
            // The snapshot doesn't contain the answer being streamed yet - keep it after the history
            messages.push(building.builder.message as ChatMessageType<T>);
            attachedId = id;
          }
          this.update({ messages });
          return;
        }
        case "interrupt": {
          this.update({ interrupts: [...this.snapshot.interrupts, ...event.interrupts] });
          return;
        }
        case "usage": {
          // A response can report usage several times (e.g. every iteration of a TanStack AI agent loop)
          usage = addUsage(usage, event.usage);
          this.update({ usage });
          return;
        }
        case "error": {
          streamError = new ChatStreamError(event.errorText);
          return;
        }
        case "abort": {
          serverAborted = true;
          return;
        }
        case "message-start":
        case "message-metadata":
        case "finish": {
          if (event.type === "finish") {
            finishReason = event.finishReason;
          }
          if (event.metadata !== undefined) {
            const validation = validateSync(this.options.metadataSchema, event.metadata, "Message metadata");
            if (!validation.ok) {
              streamError = validation.error;
              return;
            }
          }
          break;
        }
        case "data": {
          const schemas = (this.options.dataSchemas ?? {}) as Record<string, StandardSchemaV1 | undefined>;
          const validation = validateSync(schemas[event.name], event.data, `Data part "${event.name}"`);
          if (!validation.ok) {
            streamError = validation.error;
            return;
          }
          this.options.onData?.({
            name: event.name,
            ...(event.id !== undefined && { id: event.id }),
            data: validation.value,
            ...(event.transient && { transient: true }),
          } as ChatDataEventType<T>);
          break;
        }
        default: {
          break;
        }
      }

      if (building.builder.apply(event)) {
        commitMessage();
      }

      if (event.type === "tool-input-available" && !event.providerExecuted) {
        this.runClientTool(
          {
            toolName: event.toolName,
            toolCallId: event.toolCallId,
            input: event.input,
            ...(event.dynamic !== undefined && { dynamic: event.dynamic }),
          } as ChatToolCallType<T>,
          this.active,
        );
      }
    };

    let decoder: StreamParserType | null = null;
    let active: ActiveRequestType | null = null;
    let responseError: unknown;
    let sent = false;
    let failed = false;

    try {
      const streamDecoder = protocol.createDecoder(handleEvent);
      decoder = streamDecoder;
      const prepared = protocol.prepareRequest({
        chatId: this.id,
        runId,
        ...(parentRunId !== undefined && { parentRunId }),
        messages: baseMessages as ChatMessageType[],
        trigger,
        ...(options?.messageId !== undefined && { messageId: options.messageId }),
        body: this.getBody(options?.body),
        state: baseState,
        tools: getClientToolDefinitions(this.options.tools),
        resume,
      });

      let request = this.resolveRequest(trigger);
      request = request.setOptions({ ...request.options, streaming: true });
      if (prepared.headers) {
        request = request.setHeaders({
          ...(request.headers as Record<string, string> | undefined),
          ...prepared.headers,
        });
      }

      this.building = building;
      const activeRequest: ActiveRequestType = {
        runId,
        requestId: null,
        request,
        aborted: false,
      };
      active = activeRequest;
      this.active = activeRequest;

      sent = true;
      const response = await request.send({
        ...(prepared.payload !== undefined && { payload: prepared.payload }),
        onBeforeSent: ({ requestId }: { requestId: string }) => {
          activeRequest.requestId = requestId;
          // stop() called before the request id was known
          if (activeRequest.aborted) {
            cancelRequest(request, requestId);
          }
        },
        onRequestStart: () => {
          // Retried requests stream again from the beginning - drop everything the failed attempt produced
          streamDecoder.reset();
          if (!receivedEvents) {
            return;
          }
          receivedEvents = false;
          streamError = undefined;
          finishReason = undefined;
          usage = undefined;
          serverAborted = false;
          building.builder = new ChatMessageBuilder(baseAssistant);

          const patch: Partial<ChatSnapshotType<T, R>> = {
            status: "submitted",
            state: baseState,
            usage: undefined,
            interrupts: [],
          };
          const index = attachedId === null || removed ? -1 : findLastIndexById(this.snapshot.messages, attachedId);
          if (index !== -1) {
            const messages = [...this.snapshot.messages];
            if (continues) {
              messages[index] = baseAssistant as ChatMessageType<T>;
              attachedId = baseAssistant.id;
            } else {
              messages.splice(index, 1);
              attachedId = null;
            }
            patch.messages = messages;
          }
          this.update(patch);
        },
        onResponseChunk: ({ text }: { text: string }) => {
          if (activeRequest.aborted) {
            return;
          }
          try {
            streamDecoder.feed(text);
          } catch (error) {
            streamError = error as Error;
            this.stop();
          }
        },
      } as never);
      responseError = response.error;
    } catch (error) {
      // Building or sending the request threw (e.g. `body()` or `prepareBody`) - end the run with that error instead
      // of leaving the chat busy forever
      failed = true;
      streamError = streamError ?? (error as Error);
      if (!sent) {
        // Nothing reached the backend - keep the interrupt answers and the run chain for the next request
        this.pendingResume = [...resume, ...this.pendingResume];
        this.lastRunId = parentRunId;
      }
    }

    const stopped = active?.aborted ?? false;

    // Flush while the run is still active - events of a finished run are ignored
    if (decoder && !failed && !stopped && !responseError) {
      try {
        decoder.flush();
      } catch (error) {
        streamError = streamError ?? (error as Error);
      }
    }

    if (this.active === active) {
      this.active = null;
    }
    if (this.building === building) {
      this.building = null;
    }

    const isAbort = stopped || serverAborted;

    if (building.builder.finalize() && attachedId !== null) {
      commitMessage();
    }

    const error = streamError ?? (isAbort ? undefined : (responseError as ChatErrorType<R> | null | undefined));
    const isError = !!error;

    if (isError && sent && !receivedEvents && resume.length > 0) {
      // The backend never answered, so it did not get the interrupt answers either - send them with the next request
      this.pendingResume = [...resume, ...this.pendingResume];
    }

    this.update({ status: isError ? "error" : "ready", error: error ?? undefined });
    if (this.settled === settled) {
      this.settled = null;
    }
    settle();

    const isAttached = attachedId !== null && findLastIndexById(this.snapshot.messages, attachedId) !== -1;
    const message = isAttached ? (building.builder.message as ChatMessageType<T>) : undefined;
    if (isError) {
      this.options.onError?.(error as ChatErrorType<R>);
    }
    this.options.onFinish?.({
      message,
      messages: this.snapshot.messages,
      isAbort,
      isError,
      finishReason,
      usage,
    });

    if (!isError && !isAbort) {
      this.maybeSendAutomatically();
    }
  }
}

/** Create a {@link Chat} store. */
export const createChat = <T extends ChatTypes = ChatTypes, R extends RequestInstance = RequestInstance>(
  options: ChatOptionsType<T, R>,
) => new Chat<T, R>(options);
