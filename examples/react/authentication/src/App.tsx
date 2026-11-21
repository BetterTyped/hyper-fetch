import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useEffect, useState } from "react";

import { client, getMe, login, onLog, tokens } from "./api";

const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const { submit, submitting, error } = useSubmit(login);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data } = await submit({
      payload: {
        username: String(form.get("username")),
        password: String(form.get("password")),
        // A short-lived token, so you can watch it expire and refresh.
        expiresInMins: 1,
      },
    });
    if (!data) return;
    tokens.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    onLogin();
  };

  return (
    <article>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input name="username" defaultValue="emilys" required />
        </label>
        <label>
          Password
          <input name="password" type="password" defaultValue="emilyspass" required />
        </label>
        {error && <p className="error">Login failed: {error.message}</p>}
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          Log in
        </button>
      </form>
    </article>
  );
};

const Profile = ({ onLogout }: { onLogout: () => void }) => {
  const { data, error, loading, refetch } = useFetch(getMe);

  // Simulates an expired token: the next request gets a 401 and the client refreshes it.
  const breakToken = () => {
    const current = tokens.get();
    if (current) tokens.set({ ...current, accessToken: "expired" });
  };

  const logout = async () => {
    tokens.remove();
    // Cached responses belong to the old user, so they go too.
    await client.cache.clear();
    onLogout();
  };

  return (
    <article aria-busy={loading && !data}>
      {error && <p className="error">Could not load the profile: {error.message}</p>}
      {data && (
        <header className="profile">
          <img src={data.image} alt="" width={64} height={64} />
          <hgroup>
            <h3>
              {data.firstName} {data.lastName}
            </h3>
            <p>
              @{data.username} · {data.email}
            </p>
          </hgroup>
        </header>
      )}
      <div role="group">
        <button type="button" onClick={refetch} disabled={loading}>
          Reload profile
        </button>
        <button type="button" className="secondary" onClick={breakToken}>
          Expire token
        </button>
        <button type="button" className="outline" onClick={logout}>
          Log out
        </button>
      </div>
    </article>
  );
};

const ActivityLog = () => {
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => onLog((message) => setEntries((prev) => [message, ...prev].slice(0, 8))), []);

  return (
    <article>
      <h6>Activity</h6>
      {entries.length === 0 && <p className="muted">Nothing yet.</p>}
      <ol className="log">
        {entries.map((entry, index) => (
          <li key={entries.length - index}>{entry}</li>
        ))}
      </ol>
    </article>
  );
};

export const App = () => {
  const [loggedIn, setLoggedIn] = useState(() => tokens.get() !== null);

  return (
    <main className="container">
      <hgroup>
        <h1>Authentication</h1>
        <p>Log in, then press "Expire token" and "Reload profile" to watch the client refresh the token.</p>
      </hgroup>
      <div className="grid-2">
        {loggedIn ? <Profile onLogout={() => setLoggedIn(false)} /> : <LoginForm onLogin={() => setLoggedIn(true)} />}
        <ActivityLog />
      </div>
    </main>
  );
};
