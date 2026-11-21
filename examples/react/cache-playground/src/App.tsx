import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { client, defaultSettings, getPostWithSettings, setFailRequests } from "./api";
import type { Settings } from "./api";
import { CacheTable } from "./CacheTable";
import { EventLog } from "./EventLog";

const postIds = [1, 2, 3];

const PostView = ({ postId, settings }: { postId: number; settings: Settings }) => {
  const request = getPostWithSettings(postId, settings);
  const { data, error, loading, refetch } = useFetch(request, {
    revalidate: settings.revalidate,
    refetchOnFocus: settings.refetchOnFocus,
    // A changed option is a changed request. Debounce it, so dragging a slider does not send a request per step.
    bounce: true,
  });

  return (
    <article>
      <header className="toolbar">
        <strong>Post {postId}</strong>
        <div role="group">
          <button type="button" className="outline" onClick={refetch} disabled={loading}>
            Refetch
          </button>
          <button type="button" className="outline secondary" onClick={() => client.cache.invalidate(request)}>
            Invalidate
          </button>
        </div>
      </header>
      {loading && <p aria-busy="true">{data ? "Refreshing..." : "Loading..."}</p>}
      {error && !loading && <p className="error">Request failed: {error.message}</p>}
      {data && <p>{data.title}</p>}
    </article>
  );
};

type NumberKey = "staleTime" | "cacheTime" | "retry";

export const App = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [postId, setPostId] = useState<number | null>(1);
  const [fail, setFail] = useState(false);

  const change = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const slider = (key: NumberKey, min: number, max: number, unit: string) => (
    <label>
      {key}: <strong>{`${settings[key]}${unit}`}</strong>
      <input
        type="range"
        min={min}
        max={max}
        value={settings[key]}
        onChange={(event) => change(key, Number(event.target.value))}
      />
    </label>
  );

  const toggle = (key: "revalidate" | "refetchOnFocus", label: string) => (
    <label>
      <input
        type="checkbox"
        role="switch"
        checked={settings[key]}
        onChange={(event) => change(key, event.target.checked)}
      />
      {label}
    </label>
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Cache playground</h1>
        <p>Move the sliders, switch posts and leave the tab. The cache table and the event log show what happens.</p>
      </hgroup>

      <div className="grid-2">
        <section>
          <article>
            <header>
              <strong>Options</strong>
            </header>
            {slider("staleTime", 0, 60, "s")}
            {/* Removing an entry makes a mounted hook fetch it again, so a cacheTime of 0 would refetch in a loop. */}
            {slider("cacheTime", 5, 120, "s")}
            {slider("retry", 0, 3, "")}
            {toggle("revalidate", "revalidate on mount")}
            {toggle("refetchOnFocus", "refetchOnFocus")}
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={fail}
                onChange={(event) => {
                  setFail(event.target.checked);
                  setFailRequests(event.target.checked);
                }}
              />
              Make requests fail
            </label>
          </article>

          <div role="group">
            {postIds.map((id) => (
              <button
                key={id}
                type="button"
                className={id === postId ? undefined : "outline"}
                onClick={() => setPostId(id)}
              >
                Post {id}
              </button>
            ))}
            <button type="button" className={postId === null ? undefined : "outline"} onClick={() => setPostId(null)}>
              None
            </button>
          </div>
          {postId ? (
            <PostView key={postId} postId={postId} settings={settings} />
          ) : (
            <p className="muted">No post mounted.</p>
          )}
        </section>

        <section>
          <CacheTable />
          <EventLog />
        </section>
      </div>
    </main>
  );
};
