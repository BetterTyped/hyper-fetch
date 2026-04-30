# ⚛️ Hyper Fetch React

<p align="center">
  <b>React hooks for HyperFetch. Automatic fetching, caching, and real-time updates with full type safety.</b>
</p>

<p align="center">
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/hyper-fetch?logo=star&color=118ab2" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/hyper-fetch?logo=law&color=yellow" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/react">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/react.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/react">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/react?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/react">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/react?color=64BC4B&logo=package" />
  </a>
</p>

## 📖 About

`@hyper-fetch/react` connects HyperFetch's typed request system to React's component lifecycle. `useFetch` triggers
requests on mount and re-fetches when dependencies change. `useSubmit` gives you a `submit` function for mutations
triggered by user actions. Both hooks return fully typed `data`, `error`, and loading states with built-in callbacks.

## 🎯 Key Capabilities

- ⚡ **Data on mount, zero boilerplate** — `useFetch` fetches, caches, and types your data automatically
- 🎯 **Mutations that just work** — `useSubmit` handles loading, errors, and success states for form submissions
- 🔄 **Always fresh data** — Auto-refetch on window focus, polling, and stale-time revalidation built in
- ✨ **Optimistic updates with rollback** — Update the UI instantly and auto-revert if the request fails
- 🔮 **Full type safety** — Every hook, callback, response, and error is typed end-to-end with zero `any`
- 🚀 **Instant page loads** — Prefetch data before components mount so users never wait
- 🔗 **No more useEffect spaghetti** — Dependent requests via `disabled` option, no manual orchestration
- 📡 **SSR out of the box** — Works with Next.js, Remix, and any server-rendered framework
- 💎 **Skip the state library** — No Redux or Zustand needed for server state — it's all handled

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/react
```

```tsx
import { useFetch } from "@hyper-fetch/react";
import { getUsers } from "./api";

const UserList = () => {
  // Fetches on mount, returns typed data — no useEffect needed
  const { data, loading, error } = useFetch(getUsers);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;
  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

## 📚 Documentation

- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [React Overview](https://hyperfetch.bettertyped.com/docs/react/overview)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Fetch with callbacks

```tsx
import { useFetch } from "@hyper-fetch/react";

const UserProfile = ({ userId }: { userId: number }) => {
  // setParams makes the request dynamic — re-fetches when userId changes
  const { data, loading, error, onSuccess, onError } = useFetch(getUser.setParams({ userId }));

  // Typed callbacks — response shape matches your request definition
  onSuccess(({ response }) => {
    console.log("Loaded user:", response.data.name);
  });

  onError(({ response }) => {
    console.error("Failed to load user:", response.error);
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <h1>{data.name}</h1>;
};
```

### Mutations with useSubmit

```tsx
import { useSubmit } from "@hyper-fetch/react";

const CreateUserForm = () => {
  // useSubmit doesn't fire on mount — it waits for you to call submit()
  const { submit, submitting, onSubmitSuccess, onSubmitError } = useSubmit(createUser);

  // Callbacks fire after each submission with typed response data
  onSubmitSuccess(({ response }) => {
    alert(`User ${response.data.name} created!`);
  });

  onSubmitError(({ response }) => {
    alert(`Error: ${response.error.message}`);
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Pass typed payload — TypeScript ensures the shape matches your request definition
    submit({
      data: { name: form.get("name") as string, email: form.get("email") as string },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create User"}
      </button>
    </form>
  );
};
```

### Dependent requests

```tsx
const UserPosts = ({ userId }: { userId: number }) => {
  // First request fetches the user
  const { data: user } = useFetch(getUser.setParams({ userId }));
  // Second request waits until user is loaded — no useEffect chains needed
  const { data: posts } = useFetch(getUserPosts.setParams({ userId }), {
    disabled: !user,
  });

  return (
    <div>
      <h1>{user?.name}</h1>
      {posts?.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
};
```

### Optimistic updates with automatic rollback

```tsx
import { useSubmit } from "@hyper-fetch/react";

const AddComment = ({ postId }: { postId: number }) => {
  // setOptimistic runs BEFORE the request — update the list instantly
  const optimisticAdd = addComment.setParams({ postId }).setOptimistic((request, client) => {
    const cacheKey = getComments.setParams({ postId });
    const previous = client.cache.get(cacheKey);

    // Immediately insert the new comment into the cached list
    const optimisticComment = { id: `temp-${Date.now()}`, text: request.data.text, author: "You" };
    client.cache.set(cacheKey, {
      ...previous,
      data: [...(previous?.data || []), optimisticComment],
    });

    return {
      context: { previous },
      // If the request fails, put the old list back
      rollback: () => client.cache.set(cacheKey, previous),
      // On success, refetch to get the real server data
      invalidate: [cacheKey],
    };
  });

  const { submit, submitting, onSubmitError } = useSubmit(optimisticAdd);

  // mutationContext is fully typed from your setOptimistic return
  onSubmitError(({ mutationContext }) => {
    console.log("Rolled back — restored", mutationContext?.previous?.data?.length, "comments");
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = new FormData(e.currentTarget).get("text") as string;
    submit({ data: { text } });
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="text" placeholder="Write a comment..." required />
      <button type="submit" disabled={submitting}>
        Post
      </button>
    </form>
  );
};
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
