import { useFetch, useListener } from "@hyper-fetch/react";
import { useEffect } from "react";

import { getNotifications, markAllRead, markRead, type Notification, onNotification, updateNotifications } from "./api";

const useNotifications = () => {
  const { data, error, loading } = useFetch(getNotifications);
  const { connected, onEvent } = useListener(onNotification);

  // A pushed notification goes on top of the cached list, and the oldest one falls off.
  onEvent(({ data: notification }) => updateNotifications((list) => [notification, ...list]));

  const notifications = data ?? [];
  const unread = notifications.filter((item) => !item.read).length;
  return { notifications, unread, error, loading: loading && !data, connected };
};

const read = async (notification: Notification) => {
  if (notification.read) return;
  const setRead = (value: boolean) =>
    updateNotifications((list) => list.map((item) => (item.id === notification.id ? { ...item, read: value } : item)));
  // Shown as read at once, and put back when the server says no.
  setRead(true);
  const { error } = await markRead.send({ params: { id: notification.id } });
  if (error) setRead(false);
};

const readAll = async () => {
  updateNotifications((list) => list.map((item) => ({ ...item, read: true })));
  const { error } = await markAllRead.send();
  // On failure, load the real state again. The response replaces the cached list.
  if (error) getNotifications.send();
};

export const App = () => {
  const { notifications, unread, error, loading, connected } = useNotifications();

  // The unread count in the tab title, like mail and chat apps.
  useEffect(() => {
    document.title = `${unread ? `(${unread}) ` : ""}HyperFetch - Notifications`;
  }, [unread]);

  return (
    <main className="container">
      <nav>
        <ul>
          <li>
            <strong>Acme</strong>
          </li>
        </ul>
        <ul>
          <li>
            <span className="bell" aria-label={`${unread} unread notifications`}>
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3a1.5 1.5 0 0 0-3 0v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"
                />
              </svg>
              {unread > 0 && <span className="badge">{unread}</span>}
            </span>
          </li>
        </ul>
      </nav>
      <article>
        <header className="toolbar">
          <span>
            <strong>Notifications</strong> <small className="muted">{connected ? "· live" : "· connecting..."}</small>
          </span>
          <button type="button" className="outline" disabled={unread === 0} onClick={readAll}>
            Mark all as read
          </button>
        </header>
        {loading && <p aria-busy="true">Loading notifications...</p>}
        {error && <p className="error">Could not load notifications: {error.message}</p>}
        <ul className="notifications">
          {notifications.map((notification) => (
            <li key={notification.id} className={notification.read ? "read" : "unread"}>
              <button type="button" onClick={() => read(notification)}>
                <strong>{notification.title}</strong>
                <span>{notification.body}</span>
                <small className="muted">{new Date(notification.createdAt).toLocaleTimeString()}</small>
              </button>
            </li>
          ))}
        </ul>
        <footer>
          <small className="muted">Showing the newest {notifications.length}. Click one to mark it as read.</small>
        </footer>
      </article>
    </main>
  );
};
