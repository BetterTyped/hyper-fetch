import { useEmitter, useListener } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { type ChatMessage, onChatMessage, sendChatMessage, socket } from "./api";

const author = `guest-${Math.floor(Math.random() * 1000)}`;

export const App = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (entry: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${entry}`, ...prev].slice(0, 6));

  // Subscribes while the component is mounted. `connected` and `connecting` follow the socket.
  const { connected, connecting, onEvent, onConnected, onDisconnected, onReconnecting } = useListener(onChatMessage);
  const { emit } = useEmitter(sendChatMessage);

  onEvent(({ data }) => setMessages((prev) => [...prev, data]));
  onConnected(() => addLog("connected"));
  onDisconnected(() => addLog("disconnected"));
  onReconnecting(({ attempts }) => addLog(`reconnecting, attempt ${attempts}`));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text"));
    form.reset();
    emit({ payload: { id: crypto.randomUUID(), author, text, sentAt: Date.now() } });
  };

  let status = "Disconnected";
  if (connected) status = "Connected";
  else if (connecting) status = "Connecting...";

  return (
    <main className="container">
      <hgroup>
        <h1>WebSocket chat</h1>
        <p>Messages go to a public echo server and come back through the listener.</p>
      </hgroup>
      <div className="chat-layout">
        <article>
          <header className="toolbar">
            <strong aria-busy={connecting && !connected}>{status}</strong>
            <div role="group">
              <button type="button" className="outline secondary" onClick={socket.disconnect} disabled={!connected}>
                Disconnect
              </button>
              <button type="button" className="outline" onClick={socket.reconnect} disabled={connected}>
                Reconnect
              </button>
            </div>
          </header>
          <ul className="messages">
            {messages.length === 0 && <li className="muted">No messages yet. Say hi.</li>}
            {messages.map((message) => (
              <li key={message.id}>
                <small className="muted">
                  {message.author} · {new Date(message.sentAt).toLocaleTimeString()}
                </small>
                <p>{message.text}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSubmit} role="group">
            <input name="text" placeholder={connected ? "Write a message" : "Not connected"} required />
            <button type="submit" disabled={!connected}>
              Send
            </button>
          </form>
        </article>
        <article>
          <h6>Connection log</h6>
          {log.length === 0 && <p className="muted">Nothing yet. Try Disconnect and Reconnect.</p>}
          <ol className="log">
            {log.map((entry, index) => (
              <li key={log.length - index}>{entry}</li>
            ))}
          </ol>
        </article>
      </div>
    </main>
  );
};
