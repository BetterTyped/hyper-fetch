// @vitest-environment node
import { Socket } from "@hyper-fetch/sockets";
import { useEmitter } from "hooks/use-emitter";
import { useListener } from "hooks/use-listener";
import React from "react";
import { renderToString } from "react-dom/server";

type Message = { text: string };

describe("useListener & useEmitter [ SSR ]", () => {
  let socket: Socket;

  beforeEach(() => {
    // Node has a global WebSocket, so a socket created on the server connects - SSR apps turn it off there
    socket = new Socket({ url: "ws://ssr", adapterOptions: { autoConnect: false } });
    socket.onError(() => null);
  });

  afterEach(async () => {
    await socket.disconnect();
  });

  it("should run without window", () => {
    expect(typeof window).toBe("undefined");
  });

  it("should report the connection of a socket that auto connects on the server", async () => {
    const connecting = new Socket({ url: "ws://ssr-connecting" });
    connecting.onError(() => null);
    const listener = connecting.createListener<Message>()({ topic: "chat" });
    const Component = () => {
      const { connected, connecting: isConnecting } = useListener(listener);
      return (
        <p>
          {String(connected)}|{String(isConnecting)}
        </p>
      );
    };

    const html = renderToString(<Component />);

    expect(typeof globalThis.WebSocket).toBe("function");
    expect(html.replaceAll("<!-- -->", "")).toBe("<p>false|true</p>");
    await connecting.destroy();
  });

  it("should render useListener on the server with the empty state", () => {
    const listener = socket.createListener<Message>()({ topic: "chat" });
    const Component = () => {
      const { data, connected, connecting, timestamp } = useListener(listener);
      return (
        <p>
          {String(data)}|{String(connected)}|{String(connecting)}|{String(timestamp)}
        </p>
      );
    };

    const html = renderToString(<Component />);

    expect(html.replaceAll("<!-- -->", "")).toBe("<p>null|false|false|null</p>");
  });

  it("should not subscribe to the socket during the server render", () => {
    const listener = socket.createListener<Message>()({ topic: "chat" });
    const listen = vi.spyOn(socket.adapter, "listen");
    const before = socket.emitter.eventNames().length;
    const Component = () => {
      const { onEvent, onConnected } = useListener(listener);
      onEvent(() => null);
      onConnected(() => null);
      return null;
    };

    renderToString(<Component />);

    expect(listen).not.toHaveBeenCalled();
    expect(socket.adapter.listeners.size).toBe(0);
    expect(socket.emitter.eventNames()).toHaveLength(before);
  });

  it("should render useEmitter on the server with the empty state", () => {
    const emitter = socket.createEmitter<Message>()({ topic: "chat" });
    const before = socket.emitter.eventNames().length;
    const Component = () => {
      const { connected, connecting, onEmit, onEmitError } = useEmitter(emitter);
      onEmit(() => null);
      onEmitError(() => null);
      return (
        <p>
          {String(connected)}|{String(connecting)}
        </p>
      );
    };

    const html = renderToString(<Component />);

    expect(html.replaceAll("<!-- -->", "")).toBe("<p>false|false</p>");
    expect(socket.emitter.eventNames()).toHaveLength(before);
  });

  it("should render the same output for every server render", () => {
    const listener = socket.createListener<Message>()({ topic: "chat" });
    const Component = () => {
      const { data, connected } = useListener(listener, { dependencyTracking: false });
      return <p>{JSON.stringify({ data, connected })}</p>;
    };

    expect(renderToString(<Component />)).toBe(renderToString(<Component />));
  });
});
