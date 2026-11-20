import { Posts } from "./posts";
import { latestPosts } from "@/lib/api";

// Render on every request, so the server always fetches fresh posts.
export const dynamic = "force-dynamic";

/** A server component: it fetches on the server and sends the response to the browser inside the HTML. */
export default async function Page() {
  const response = await latestPosts.send();

  return (
    <main className="container">
      <hgroup>
        <h1>Posts</h1>
        <p>Fetched on the server at {new Date().toLocaleTimeString()}, hydrated into the client cache.</p>
      </hgroup>
      {/* Only plain data crosses into client components. A failed response is left out and fetched in the browser. */}
      <Posts hydration={[response.success ? latestPosts.dehydrate({ response }) : null]} />
    </main>
  );
}
