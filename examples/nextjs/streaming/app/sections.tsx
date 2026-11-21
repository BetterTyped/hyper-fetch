"use client";

import { useFetch } from "@hyper-fetch/react";

import { currentUser, latestPosts, topProducts } from "@/lib/api";

// Each hook starts with the data streamed from the server: no loading state and, while it is fresh, no request.

export const Profile = () => {
  const { data, error } = useFetch(currentUser, { revalidate: false });
  if (error || !data) return <p className="error">Could not load the profile.</p>;
  return (
    <p>
      <strong>
        {data.firstName} {data.lastName}
      </strong>
      , {data.company.title}
      <br />
      <small className="muted">{data.email}</small>
    </p>
  );
};

export const Posts = () => {
  const { data, error, loading, refetch } = useFetch(latestPosts, {
    revalidate: false,
  });
  if (error || !data) return <p className="error">Could not load posts.</p>;
  return (
    <>
      <ul>
        {data.posts.map((post) => (
          <li key={post.id}>
            {post.title} <small className="muted">{post.views} views</small>
          </li>
        ))}
      </ul>
      {/* The hook is live after hydration: this sends the request from the browser. */}
      <button type="button" className="outline secondary" onClick={refetch} aria-busy={loading} disabled={loading}>
        Refetch in the browser
      </button>
    </>
  );
};

export const Products = () => {
  const { data, error } = useFetch(topProducts, { revalidate: false });
  if (error || !data) return <p className="error">Could not load products.</p>;
  return (
    <ul>
      {data.products.map((product) => (
        <li key={product.id}>
          {product.title}{" "}
          <small className="muted">
            ${product.price}, rated {product.rating}
          </small>
        </li>
      ))}
    </ul>
  );
};
