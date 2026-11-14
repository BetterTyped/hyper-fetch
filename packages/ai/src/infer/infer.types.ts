import type { InferSchemaOutput, StandardSchemaV1 } from "../schema/standard-schema.types";

/* -------------------------------------------------------------------------------------------------
 * AI SDK - derive chat types from your `UIMessage` type (type-only, no runtime dependency on `ai`)
 * -----------------------------------------------------------------------------------------------*/

type PartsOf<Message> = Message extends { parts: readonly (infer Part)[] } ? Part : never;

/** Tool types from an AI SDK `UIMessage<Metadata, DataParts, Tools>` type. */
export type InferAISDKTools<Message> = {
  [Part in Extract<
    PartsOf<Message>,
    { type: `tool-${string}`; state: "output-available" }
  > as Part["type"] extends `tool-${infer Name}` ? Name : never]: {
    input: Part extends { input: infer Input } ? Input : unknown;
    output: Part extends { output: infer Output } ? Output : unknown;
  };
};

/** Data part types from an AI SDK `UIMessage` type. */
export type InferAISDKData<Message> = {
  [Part in Extract<PartsOf<Message>, { type: `data-${string}` }> as Part["type"] extends `data-${infer Name}`
    ? Name
    : never]: Part extends { data: infer Data } ? Data : unknown;
};

/** Metadata type from an AI SDK `UIMessage` type. */
export type InferAISDKMetadata<Message> = Message extends { metadata?: infer Metadata } ? Metadata : unknown;

/**
 * Chat types from your backend's AI SDK `UIMessage` type, for end-to-end type safety:
 *
 * @example
 * // server
 * export type MyUIMessage = UIMessage<{ model: string }, { weather: Weather }, InferUITools<typeof tools>>;
 * // client
 * import type { MyUIMessage } from "../server/chat";
 * const chat = useChat<InferAISDKChatTypes<MyUIMessage>>({ request, protocol: aiSDKProtocol() });
 */
export type InferAISDKChatTypes<Message> = {
  metadata: InferAISDKMetadata<Message>;
  data: InferAISDKData<Message>;
  tools: InferAISDKTools<Message>;
};

/* -------------------------------------------------------------------------------------------------
 * Tool definitions - AI SDK `tool()`, TanStack AI `toolDefinition()`, or anything with Standard Schemas
 * -----------------------------------------------------------------------------------------------*/

type UnwrapToolOutput<Value> = Value extends AsyncIterable<infer Item> ? Item : Value;

type SchemaOutput<Schema> = Schema extends StandardSchemaV1 ? InferSchemaOutput<Schema> : never;

type ToolInputFromSchema<Tool> = Tool extends { inputSchema: infer Schema }
  ? [SchemaOutput<Schema>] extends [never]
    ? unknown
    : SchemaOutput<Schema>
  : unknown;

/** Input type of a tool definition: from `execute`'s first parameter, or from `inputSchema`. */
export type InferToolInput<Tool> = Tool extends { execute?: (input: infer Input, ...args: any[]) => any }
  ? unknown extends Input
    ? ToolInputFromSchema<Tool>
    : Input
  : ToolInputFromSchema<Tool>;

/** Output type of a tool definition: from `outputSchema`, or from what `execute` returns. */
export type InferToolOutput<Tool> = Tool extends { outputSchema: infer Schema }
  ? [SchemaOutput<Schema>] extends [never]
    ? unknown
    : SchemaOutput<Schema>
  : Tool extends { execute?: (...args: any[]) => infer Result }
    ? UnwrapToolOutput<Awaited<Result>>
    : unknown;

/**
 * Tool types from a tool set (`Record<name, tool>`, AI SDK) or a tool array (`[toolDefinition(...)]`, TanStack AI
 * - tools need a literal `name`).
 */
export type InferChatTools<Tools> = Tools extends readonly unknown[]
  ? {
      [Tool in Tools[number] as Tool extends { name: infer Name extends string } ? Name : never]: {
        input: InferToolInput<Tool>;
        output: InferToolOutput<Tool>;
      };
    }
  : { [Name in keyof Tools & string]: { input: InferToolInput<Tools[Name]>; output: InferToolOutput<Tools[Name]> } };
