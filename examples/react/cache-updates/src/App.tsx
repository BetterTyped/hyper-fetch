import { useCache, useFetch } from "@hyper-fetch/react";

import { getUserRequest, updateCachedUser } from "./api";

/** `useCache` only reads the cache. It never sends a request, so it is cheap to use anywhere. */
const NavBar = () => {
  const { data } = useCache(getUserRequest);

  return (
    <nav>
      <ul>
        <li>
          <strong>Acme</strong>
        </li>
      </ul>
      <ul>
        <li className="muted">{data ? `Signed in as ${data.firstName} ${data.lastName}` : "Not loaded yet"}</li>
        {data && <img className="avatar" src={data.image} alt="" />}
      </ul>
    </nav>
  );
};

/** `select` picks one field. This component re-renders only when the email changes. */
const EmailBadge = () => {
  const { data: email } = useCache(getUserRequest, {
    select: (user) => user.email,
  });
  return <p>{email && <mark>{email}</mark>}</p>;
};

/** The one place that fetches. The other components show whatever this request put in the cache. */
const ProfileEditor = () => {
  const { data, error, loading, refetch } = useFetch(getUserRequest);

  if (error) return <article>Could not load the user: {error.message}</article>;
  if (!data) return <article aria-busy="true">Loading profile...</article>;

  return (
    <article>
      <header className="toolbar">
        <strong>Profile</strong>
        <button type="button" className="outline secondary" onClick={refetch} aria-busy={loading} disabled={loading}>
          Reload from server
        </button>
      </header>
      {/* Every keystroke goes straight into the cache, and every reader of `getUserRequest` follows it. */}
      <label>
        First name
        <input value={data.firstName} onChange={(event) => updateCachedUser({ firstName: event.target.value })} />
      </label>
      <label>
        Last name
        <input value={data.lastName} onChange={(event) => updateCachedUser({ lastName: event.target.value })} />
      </label>
      <label>
        Email
        <input type="email" value={data.email} onChange={(event) => updateCachedUser({ email: event.target.value })} />
      </label>
    </article>
  );
};

export const App = () => (
  <>
    <header className="container">
      <NavBar />
    </header>
    <main className="container narrow">
      <hgroup>
        <h1>Cache updates</h1>
        <p>Edit the profile. Every component that reads the same request updates at once, without a request.</p>
      </hgroup>
      <EmailBadge />
      <ProfileEditor />
    </main>
  </>
);
