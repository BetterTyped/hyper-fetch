import { useFetch } from "@hyper-fetch/react";
import { useSyncExternalStore } from "react";
import {
  type ActionFunctionArgs,
  data,
  Form,
  Link,
  type LoaderFunctionArgs,
  NavLink,
  Outlet,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from "react-router";

import { client, getNetworkLog, subscribeNetworkLog, updateUser, userDetails, userList } from "./api";

// Loaders run before a route renders. `cache-first` returns cached data at once and only goes to the network for new data.

export const rootLoader = async ({ request }: LoaderFunctionArgs) => {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  await userList(q).send({ cachePolicy: "cache-first" });
  return { q };
};

export const userLoader = async ({ params }: LoaderFunctionArgs) => {
  const userId = Number(params.userId);
  const response = await userDetails(userId).send({
    cachePolicy: "cache-first",
  });
  if (response.status === 404) throw data("User not found", { status: 404 });
  return null;
};

/** Saves the form, writes the answer into the cache and goes back to the user page. */
export const editAction = async ({ params, request }: ActionFunctionArgs) => {
  const userId = Number(params.userId);
  const form = await request.formData();
  const payload = {
    firstName: String(form.get("firstName")),
    lastName: String(form.get("lastName")),
    email: String(form.get("email")),
    phone: String(form.get("phone")),
  };
  const response = await updateUser.setParams({ userId }).send({ payload });
  if (!response.data) return { error: response.error?.message ?? "Could not save" };

  // Write the saved user into the cache, so the next loader and hook read it without a request. dummyjson does not
  // store changes, which is why the list keeps the old name. With a real API, also invalidate the list here.
  const saved = response.data;
  client.cache.update(userDetails(userId), (cached) => (cached?.data ? { data: { ...cached.data, ...saved } } : {}));
  return redirect(`/users/${userId}`);
};

const NetworkLog = () => {
  const log = useSyncExternalStore(subscribeNetworkLog, getNetworkLog);
  return (
    <article>
      <header>Requests sent to the network</header>
      {log.length === 0 && <small className="muted">None yet.</small>}
      <ul className="log">
        {log.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
    </article>
  );
};

export const Root = () => {
  const { q } = useLoaderData<typeof rootLoader>();
  // The loader filled the cache, so this renders the list at once.
  const { data: list, error } = useFetch(userList(q), { revalidate: false });
  const navigation = useNavigation();

  return (
    <main className="container grid-2">
      <aside>
        <Form role="search">
          <input key={q} name="q" type="search" defaultValue={q} placeholder="Search users" aria-label="Search users" />
        </Form>
        {error && <p className="error">Could not load users: {error.message}</p>}
        <ul className="users" aria-label="Users">
          {list?.users.map((user) => (
            <li key={user.id}>
              <NavLink to={`/users/${user.id}${q ? `?q=${q}` : ""}`}>
                {user.firstName} {user.lastName}
              </NavLink>
            </li>
          ))}
        </ul>
        <NetworkLog />
      </aside>
      <section aria-busy={navigation.state === "loading"}>
        <Outlet />
      </section>
    </main>
  );
};

export const Home = () => (
  <hgroup>
    <h1>Contacts</h1>
    <p>Pick a user. Each route loader prefetches through HyperFetch, and the components read the cache.</p>
  </hgroup>
);

export const UserPage = () => {
  const userId = Number(useParams().userId);
  const { data: user } = useFetch(userDetails(userId), { revalidate: false });
  if (!user) return null;

  return (
    <article>
      <header>
        <h2>
          {user.firstName} {user.lastName}
        </h2>
        <small className="muted">{user.company.title}</small>
      </header>
      <p>
        {user.email}
        <br />
        {user.phone}
      </p>
      <Link to="edit" role="button" className="outline">
        Edit
      </Link>
    </article>
  );
};

export const EditUser = () => {
  const userId = Number(useParams().userId);
  const { data: user } = useFetch(userDetails(userId), { revalidate: false });
  const navigation = useNavigation();
  const result = useActionData<typeof editAction>();
  if (!user) return null;

  return (
    <Form method="post" key={userId}>
      <fieldset className="grid">
        <input name="firstName" defaultValue={user.firstName} aria-label="First name" />
        <input name="lastName" defaultValue={user.lastName} aria-label="Last name" />
      </fieldset>
      <input name="email" type="email" defaultValue={user.email} aria-label="Email" />
      <input name="phone" defaultValue={user.phone} aria-label="Phone" />
      <button type="submit" aria-busy={navigation.state === "submitting"}>
        Save
      </button>
      {result?.error && <small className="error">{result.error}</small>}
    </Form>
  );
};

export const RouteError = () => (
  <article>
    <p className="error">This page could not be loaded.</p>
    <Link to="/">Back to the list</Link>
  </article>
);
