import type { RequestInstance } from "@hyper-fetch/core";
import { type ReactNode, Suspense } from "react";

import { HydrateClient } from "./hydrate-client";
import { Posts, Products, Profile } from "./sections";
import { currentUser, latestPosts, topProducts } from "@/lib/api";

// Render on every request, so the server always fetches fresh data.
export const dynamic = "force-dynamic";

type SectionProps = {
  title: string;
  request: RequestInstance;
  startedAt: number;
  children: ReactNode;
};

const Panel = ({ title, note, children }: { title: string; note: string; children: ReactNode }) => (
  <article>
    <header className="toolbar">
      <strong>{title}</strong>
      <small className="muted">{note}</small>
    </header>
    {children}
  </article>
);

const Fallback = ({ title }: { title: string }) => (
  <Panel title={title} note="streaming...">
    <p aria-busy="true">Waiting for the server</p>
  </Panel>
);

/**
 * An async server component. Each section awaits its own request, so a slow one never holds back the others, and
 * passes the dehydrated response to the client hooks below it.
 */
async function Section({ title, request, startedAt, children }: SectionProps) {
  const response = await request.send();
  // Only plain data crosses into client components. A failed response is left out and fetched in the browser.
  const hydration = [response.success ? request.dehydrate({ response }) : null];

  return (
    <Panel title={title} note={`streamed after ${Date.now() - startedAt} ms`}>
      <HydrateClient data={hydration}>{children}</HydrateClient>
    </Panel>
  );
}

export default function Page() {
  const startedAt = Date.now();

  return (
    <main className="container">
      <hgroup>
        <h1>Streaming dashboard</h1>
        <p>The page shell arrives at once. Each section streams in when its data is ready on the server.</p>
      </hgroup>
      {/* Every Suspense boundary is sent as soon as its own request resolves. */}
      <Suspense fallback={<Fallback title="Profile" />}>
        <Section title="Profile" request={currentUser} startedAt={startedAt}>
          <Profile />
        </Section>
      </Suspense>
      <Suspense fallback={<Fallback title="Latest posts" />}>
        <Section title="Latest posts" request={latestPosts} startedAt={startedAt}>
          <Posts />
        </Section>
      </Suspense>
      <Suspense fallback={<Fallback title="Top products" />}>
        <Section title="Top products" request={topProducts} startedAt={startedAt}>
          <Products />
        </Section>
      </Suspense>
    </main>
  );
}
