import { useFetch } from "@hyper-fetch/react";
import type { GetServerSideProps } from "next";
import Link from "next/link";

import type { HydrationProps } from "./_app";
import { latestPosts } from "@/lib/api";

type Props = HydrationProps & { renderedAt: string };

/** Runs on the server for every request, also when you navigate here with a `Link`. */
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const response = await latestPosts.send();

  return {
    props: {
      renderedAt: new Date().toLocaleTimeString(),
      // A failed response is left out, and `useFetch` fetches it in the browser instead.
      hydration: response.success ? [latestPosts.dehydrate({ response })] : [],
    },
  };
};

export default function Home({ renderedAt }: Props) {
  // The first render already has the server data: no loading state and, while it is fresh, no request.
  const { data, error, loading } = useFetch(latestPosts, { revalidate: false });

  return (
    <>
      <hgroup>
        <h1>Posts</h1>
        <p>Fetched in getServerSideProps at {renderedAt}, hydrated into the client cache.</p>
      </hgroup>
      {loading && !data && <p aria-busy="true">Loading posts...</p>}
      {error && <p className="error">Could not load posts: {error.message}</p>}
      {data?.posts.map((post) => (
        <article key={post.id}>
          <Link href={`/posts/${post.id}`}>
            <strong>{post.title}</strong>
          </Link>
          <br />
          <small className="muted">
            {post.views} views · {post.tags.join(", ")}
          </small>
        </article>
      ))}
    </>
  );
}
