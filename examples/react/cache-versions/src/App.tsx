import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { bumpWithRelease, cacheVersion, client, getUser, readPersisted, release, setDemo } from "./api";

const pageLoadedAt = Date.now();
// Taken before any hook reads the cache, which is when old entries get removed.
const atPageLoad = readPersisted();

const Profile = () => {
  // Cache first: a fresh entry from localStorage is used without a request.
  const { data, error, loading, responseTimestamp } = useFetch(getUser, { revalidate: false });

  if (loading && !data) return <p aria-busy="true">Loading the user from the network...</p>;
  if (error) return <p className="error">Could not load the user: {error.message}</p>;
  if (!data) return null;

  const fromStorage = responseTimestamp !== null && responseTimestamp.getTime() < pageLoadedAt;

  return (
    <article>
      <p>{fromStorage ? <mark>Read from localStorage</mark> : "Fetched from the network"}</p>
      <div className="profile">
        {release === 2 &&
          (data.image ? <img src={data.image} alt="" width={64} height={64} /> : <div className="avatar" />)}
        <div>
          <strong>
            {data.firstName} {data.lastName}
          </strong>
          {/* Release 2 reads a field that release 1 never saved. */}
          {release === 2 && (
            <p>{data.email ?? <span className="error">email is missing: this is release 1 data</span>}</p>
          )}
        </div>
      </div>
    </article>
  );
};

const EntryList = ({ entries }: { entries: ReturnType<typeof readPersisted> }) => (
  <ul className="list">
    {entries.length === 0 && <li className="muted">Empty</li>}
    {entries.map(({ key, version }) => (
      <li key={key}>
        <code>{key}</code>
        {version === cacheVersion ? <small>{version}</small> : <mark>{version}: ignored and removed</mark>}
      </li>
    ))}
  </ul>
);

const Persisted = () => {
  const [now, setNow] = useState(readPersisted);

  useEffect(() => client.cache.events.onData(() => setNow(readPersisted())), []);

  return (
    <article>
      <h6>
        Cache version <code>{cacheVersion}</code>
      </h6>
      <small className="muted">localStorage at page load</small>
      <EntryList entries={atPageLoad} />
      <small className="muted">localStorage now</small>
      <EntryList entries={now} />
    </article>
  );
};

export const App = () => (
  <main className="container">
    <hgroup>
      <h1>Cache versions</h1>
      <p>Load release 1, then deploy release 2. Without a version bump, release 2 reads the old saved shape.</p>
    </hgroup>
    <div className="toolbar">
      <div role="group">
        {[1, 2].map((value) => (
          <button
            key={value}
            type="button"
            className={value === release ? undefined : "outline secondary"}
            onClick={() => setDemo(value, bumpWithRelease)}
          >
            Release {value}
          </button>
        ))}
      </div>
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={bumpWithRelease}
          onChange={(event) => setDemo(release, event.target.checked)}
        />
        Bump cache version with the release
      </label>
    </div>
    <div className="grid-2">
      <Profile />
      <Persisted />
    </div>
  </main>
);
