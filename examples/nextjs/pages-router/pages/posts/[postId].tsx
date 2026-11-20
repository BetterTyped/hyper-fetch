import { useFetch } from "@hyper-fetch/react";
import type { GetServerSideProps } from "next";
import Link from "next/link";

import type { HydrationProps } from "../_app";
import { getPost } from "@/lib/api";

type Props = HydrationProps & { postId: number };

export const getServerSideProps: GetServerSideProps<Props, { postId: string }> = async ({ params }) => {
  const postId = Number(params?.postId);
  const request = getPost.setParams({ postId });
  const response = await request.send();

  if (response.status === 404) return { notFound: true };
  return {
    props: {
      postId,
      hydration: response.success ? [request.dehydrate({ response })] : [],
    },
  };
};

export default function PostPage({ postId }: Props) {
  // Same params as on the server, so the same cache key: the hydrated post renders at once.
  const { data, error, loading, refetch } = useFetch(getPost.setParams({ postId }), { revalidate: false });

  return (
    <>
      <nav>
        <Link href="/">Back to posts</Link>
      </nav>
      {loading && !data && <p aria-busy="true">Loading post...</p>}
      {error && <p className="error">Could not load the post: {error.message}</p>}
      {data && (
        <article>
          <header>
            <strong>{data.title}</strong>
            <br />
            <small className="muted">{data.views} views</small>
          </header>
          <p>{data.body}</p>
          <footer>
            <button
              type="button"
              className="outline secondary"
              onClick={refetch}
              aria-busy={loading}
              disabled={loading}
            >
              Refetch in the browser
            </button>
          </footer>
        </article>
      )}
    </>
  );
}
