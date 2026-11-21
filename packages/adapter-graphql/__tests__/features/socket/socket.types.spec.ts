import type { ExtractListenerPayloadType, ExtractListenerResponseType } from "@hyper-fetch/sockets";
import { Socket } from "@hyper-fetch/sockets";
import type { DocumentNode, GraphQLFormattedError } from "graphql";
import gql from "graphql-tag";
import { expectTypeOf } from "vitest";

import type {
  GraphqlSubscriptionError,
  GraphqlWsAdapterType,
  GraphqlWsExtraType,
  GraphqlWsListenerOptionsType,
} from "../../../src";
import { GraphqlWsAdapter } from "../../../src";

/** The decoration graphql-codegen and gql.tada add to documents - `DocumentTypeDecoration` of `@graphql-typed-document-node/core` */
type TypedDocument<Result, Variables> = DocumentNode & { __apiType?: (variables: Variables) => Result };

type OnMessageResult = { onMessage: { text: string } };
const OnMessageDocument = gql`
  subscription OnMessage($room: String!) {
    onMessage(room: $room) {
      text
    }
  }
` as TypedDocument<OnMessageResult, { room: string; limit?: number }>;
// Codegen types an operation without variables this way
const OnTickDocument = gql`
  subscription OnTick {
    tick
  }
` as TypedDocument<{ tick: number }, { [key: string]: never }>;

describe("Graphql Ws Adapter [ Types ]", () => {
  const socket = new Socket({ url: "ws://localhost", adapter: GraphqlWsAdapter(), adapterOptions: { lazy: true } });

  it("should type the adapter", () => {
    expectTypeOf(socket.adapter).toEqualTypeOf<GraphqlWsAdapterType>();
    expectTypeOf<GraphqlWsListenerOptionsType["document"]>().toEqualTypeOf<string | DocumentNode | undefined>();
  });

  describe("when the listener has a typed document", () => {
    const onMessage = socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } });

    it("should take the data and the variables from the document", () => {
      expectTypeOf<ExtractListenerResponseType<typeof onMessage>>().toEqualTypeOf<OnMessageResult>();
      expectTypeOf<ExtractListenerPayloadType<typeof onMessage>>().toEqualTypeOf<{ room: string; limit?: number }>();

      onMessage.listen(
        ({ data, extra }) => {
          expectTypeOf(data).toEqualTypeOf<OnMessageResult>();
          expectTypeOf(extra).toEqualTypeOf<GraphqlWsExtraType>();
          expectTypeOf(extra.errors).toEqualTypeOf<GraphQLFormattedError[] | undefined>();
        },
        { payload: { room: "a" } },
      );
    });

    it("should require the variables of the document", () => {
      onMessage.setPayload({ room: "a" }).listen(() => null);
      onMessage.setPayload({ room: "a", limit: 1 }).listen(() => null);
      // @ts-expect-error the variables are required by the document
      onMessage.listen(() => null);
      // @ts-expect-error room is a string
      onMessage.setPayload({ room: 1 });
      // @ts-expect-error room is required
      onMessage.setPayload({ limit: 1 });
    });

    it("should not need a payload for a document without variables", () => {
      const onTick = socket.createListener()({ topic: "OnTick", options: { document: OnTickDocument } });

      expectTypeOf<ExtractListenerPayloadType<typeof onTick>>().toEqualTypeOf<undefined>();
      onTick.listen(({ data }) => {
        expectTypeOf(data).toEqualTypeOf<{ tick: number }>();
      });
    });

    it("should keep the declared generics over the document", () => {
      const declared = socket.createListener<{ custom: true }, { id: string }>()({
        topic: "OnMessage",
        options: { document: OnMessageDocument },
      });

      expectTypeOf<ExtractListenerResponseType<typeof declared>>().toEqualTypeOf<{ custom: true }>();
      expectTypeOf<ExtractListenerPayloadType<typeof declared>>().toEqualTypeOf<{ id: string }>();
    });

    it("should type the delivery strategy with the data of the document", () => {
      const batched = socket.createListener()({
        topic: "OnMessage",
        options: { document: OnMessageDocument },
        delivery: { strategy: "batch", interval: 100 },
      });

      batched.listen(
        ({ data }) => {
          expectTypeOf(data).toEqualTypeOf<OnMessageResult[]>();
        },
        { payload: { room: "a" } },
      );
    });
  });

  describe("when the listener has no typed document", () => {
    it("should keep an untyped document untyped", () => {
      const untyped = socket.createListener()({
        topic: "OnMessage",
        options: {
          document: gql`
            subscription {
              a
            }
          `,
        },
      });

      expectTypeOf<ExtractListenerResponseType<typeof untyped>>().toEqualTypeOf<unknown>();
      expectTypeOf<ExtractListenerPayloadType<typeof untyped>>().toEqualTypeOf<undefined>();
    });

    it("should use the generics for a document in the topic", () => {
      const listener = socket.createListener<{ tick: number }>()({ topic: "subscription { tick }" });

      expectTypeOf<ExtractListenerResponseType<typeof listener>>().toEqualTypeOf<{ tick: number }>();
    });

    it("should reject options of other adapters", () => {
      // @ts-expect-error document has to be a string or a DocumentNode
      socket.createListener()({ topic: "OnMessage", options: { document: 1 } });
      // @ts-expect-error unknown listener option
      socket.createListener()({ topic: "OnMessage", options: { other: true } });
    });
  });

  it("should type the subscription error", () => {
    expectTypeOf<GraphqlSubscriptionError["errors"]>().toEqualTypeOf<GraphQLFormattedError[]>();
    expectTypeOf<GraphqlSubscriptionError["payload"]>().toEqualTypeOf<unknown>();
  });

  it("should accept only valid adapter options", () => {
    // eslint-disable-next-line no-new
    new Socket({
      url: "ws://localhost",
      adapter: GraphqlWsAdapter(),
      adapterOptions: {
        connectionParams: async () => ({ token: "a" }),
        keepAlive: { enabled: true, intervalMs: 1000 },
        lazy: true,
        lazyCloseTimeout: 100,
      },
    });
    // eslint-disable-next-line no-new
    new Socket({
      url: "ws://localhost",
      adapter: GraphqlWsAdapter(),
      // @ts-expect-error the connection params are an object
      adapterOptions: { connectionParams: "token" },
    });
  });
});
