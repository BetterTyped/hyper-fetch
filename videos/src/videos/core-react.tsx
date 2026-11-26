import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, outQuint, progress, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Stack } from "../brand/Timeline";
import { body, color, mono } from "../brand/tokens";
import { Chip, Eyebrow, Logo, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";

import { Outro } from "../scenes/Outro";
import { AppWindow, Caption, Skeleton } from "../visuals/app";
import { Beam, Mono, Row, Swap } from "../visuals/common";
import { Icon } from "../visuals/extra";

/*
 * Core and React in v10. Every scene follows one anatomy: the line of real code that matters, a lit Beam, and a
 * product window filled with concrete rows whose footer carries the payoff. One eyebrow and one short title on
 * top. Every hit sits on the beat grid (see motion.beat).
 */

/* A lit cable between two side-by-side elements, from y1 on the left edge to y2 on the right edge */
const Bridge: React.FC<{ width: number; y1: number; y2: number; at: number; drawAt?: number }> = ({ width, y1, y2, at, drawAt }) => (
  <div style={{ position: "relative", width, alignSelf: "stretch", flexShrink: 0 }}>
    <svg width={width} height={Math.max(y1, y2) + 20} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Beam x1={0} y1={y1} x2={width} y2={y2} at={at} drawAt={drawAt} />
    </svg>
  </div>
);

const Dot: React.FC<{ tone: "green" | "gold" | "red" | "zinc" }> = ({ tone }) => {
  const c = tone === "green" ? color.green : tone === "gold" ? color.bolt : tone === "red" ? color.red : color.zinc500;
  return <span style={{ width: 11, height: 11, borderRadius: 99, background: c, boxShadow: `0 0 10px ${c}`, display: "inline-block" }} />;
};

const Box: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      width: 30,
      height: 30,
      borderRadius: 9,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: on ? "rgba(251,198,70,0.18)" : "transparent",
      boxShadow: `inset 0 0 0 2px ${on ? color.bolt : color.zinc600}`,
      flexShrink: 0,
    }}
  >
    {on && <Icon name="check" size={20} width={3} />}
  </span>
);

const Status: React.FC<{ code: string; tone: "green" | "red" | "gold" | "zinc" | "blue" }> = ({ code, tone }) => (
  <Chip tone={tone} size={17}>
    {code}
  </Chip>
);

/* ----------------------------------------------------------------------------------------------- optimistic */

const CREATE_TODO = `
optimistic(getTodos)
  .insert({ ...payload, id: tempId })
  .rollback(({ data }) => data.filter((todo) => todo.id !== tempId))
  .commit(({ data, response }) =>
    data.map((todo) => (todo.id === tempId ? response.data : todo)),
  ),
`;

const Optimistic: React.FC = () => {
  const frame = useCurrentFrame();
  const firstAt = beat(3);
  const failAt = beat(6);
  const secondAt = beat(9);
  const commitAt = beat(12);
  return (
    <Stack
      top={170}
      gap={90}
      copy={
        <>
          <Eyebrow>Optimistic updates</Eyebrow>
          <Title size={100} align="center" delay={4}>
            Describe the change.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ paddingTop: 20 }}>
            <CodeWindow
              file="create-todo.ts"
              code={CREATE_TODO}
              fontSize={23}
              width={990}
              delay={beat(0)}
              marks={[
                { lines: [2, 2], from: firstAt - 20, until: failAt - 10 },
                { lines: [3, 3], from: failAt - 10, until: secondAt - 10, tone: "red" },
                { lines: [2, 2], from: secondAt - 10, until: commitAt - 10 },
                { lines: [4, 5], from: commitAt - 10, tone: "green" },
              ]}
            />
          </div>
          <Bridge width={100} y1={190} y2={190} at={firstAt - 16} drawAt={beat(1)} />
          <AppWindow
            address="/todos"
            footer="network"
            at={beat(1)}
            order={2}
            width={580}
            minHeight={230}
            status={frame >= commitAt ? "201 · committed" : "500 · rolled back"}
            statusAt={failAt}
            statusTone={frame >= commitAt ? "green" : "red"}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Row icon={<Box on />} label="Write the post" value={<Mono color={color.zinc500}>id: 41</Mono>} />
              <Row icon={<Box on={false} />} label="Ship v10" enterAt={firstAt} exitAt={failAt} state="pending" value={<Mono color={color.zinc500}>tempId</Mono>} />
              <Row
                icon={<Box on={frame >= commitAt} />}
                label="Ship v10"
                enterAt={secondAt}
                flashAt={commitAt}
                state={frame >= commitAt ? "idle" : "pending"}
                value={
                  <Mono color={frame >= commitAt ? color.green : color.zinc500}>
                    <Swap from="tempId" to="id: 42" at={commitAt} />
                  </Mono>
                }
              />
            </div>
          </AppWindow>
          <Sfx at={firstAt} name="pop" volume={0.65} />
          <Sfx at={failAt} name="error" volume={0.5} />
          <Sfx at={secondAt} name="pop" volume={0.65} />
          <Sfx at={commitAt} name="success" volume={0.4} />
        </div>
      }
    />
  );
};

/* ----------------------------------------------------------------------------------------------- infinite */

const FEED_CODE = `
const { items, hasNextPage, fetchNextPage } = useInfiniteFetch(getFeed, {
  pagination: { cursor: "cursor", next: "nextCursor", items: "data" },
});
`;

const POSTS = [
  ["Shipping v10", "Ada"],
  ["Typed tRPC clients", "Alan"],
  ["Sockets that recover", "Grace"],
  ["Persisted queries", "Linus"],
  ["Hydrate on the server", "Ada"],
  ["Retry backoff", "Grace"],
  ["Offline queues", "Alan"],
  ["A live cache", "Linus"],
  ["88 examples", "Ada"],
];

const Spinner: React.FC<{ until: number }> = ({ until }) => {
  const frame = useCurrentFrame();
  /* It turns only while the page loads and is gone before the rows land */
  return (
    <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", opacity: frame < until ? 1 : 0 }}>
      <svg width={30} height={30} viewBox="0 0 24 24" style={{ transform: `rotate(${frame * 12}deg)` }}>
        <circle cx={12} cy={12} r={9} stroke={color.zinc700} strokeWidth={3} fill="none" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke={color.bolt} strokeWidth={3} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const Infinite: React.FC = () => {
  const frame = useCurrentFrame();
  const pages = [beat(1.5), beat(4.5), beat(7.5)];
  const endAt = beat(9.5);
  const scrollY = interpolate(frame, [pages[2] - 6, pages[2] + 24], [0, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pageCount = pages.filter((p) => frame >= p).length;
  return (
    <Stack
      top={90}
      gap={60}
      visualScale={0.96}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo name="react" size={34} />
            <Eyebrow>useInfiniteFetch</Eyebrow>
          </div>
          <Title size={100} align="center" delay={4}>
            Infinite lists, one description.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ paddingTop: 220 }}>
            <CodeWindow file="feed.tsx" code={FEED_CODE} fontSize={22} width={1040} delay={beat(0.3)} marks={[{ lines: [2, 2], from: beat(1) }]} />
          </div>
          <Bridge width={100} y1={320} y2={260} at={pages[0] - 16} drawAt={beat(0.8)} />
          <AppWindow
            address="/feed"
            footer="network"
            at={beat(0.3)}
            order={2}
            width={560}
            minHeight={540}
            headerRight={<span>page {Math.max(1, pageCount)}</span>}
            status={frame >= endAt ? "3 pages · end of list" : undefined}
            statusAt={endAt}
            statusTone="gold"
          >
            <div style={{ height: 540, overflow: "hidden" }}>
              <div style={{ transform: `translateY(${-scrollY}px)`, display: "flex", flexDirection: "column", gap: 10 }}>
                {frame < pages[0] && <Skeleton rows={3} />}
                {POSTS.map(([title, author], i) => (
                  <Row key={title} label={title} enterAt={pages[Math.floor(i / 3)] + (i % 3) * 5} value={<Mono color={color.zinc500}>{author}</Mono>} />
                ))}
                {frame >= pages[1] - 26 && frame < pages[1] && <Spinner until={pages[1]} />}
                {frame >= pages[2] - 26 && frame < pages[2] && <Spinner until={pages[2]} />}
              </div>
            </div>
          </AppWindow>
          {pages.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && <Sfx at={p - 26} name="tick" volume={0.45} />}
              <Sfx at={p} name="pop" volume={0.55} />
            </React.Fragment>
          ))}
          <Sfx at={endAt} name="ding" volume={0.3} />
        </div>
      }
    />
  );
};

/* ----------------------------------------------------------------------------------------------- hydrate */

const SERVER_CODE = `return <UsersList hydration={[getUsers.dehydrate({ response })]} />;`;
const CLIENT_CODE = `<Hydrate client={client} data={hydration}>`;

const USERS = ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Linus Torvalds"];

const Hydrate: React.FC = () => {
  const frame = useCurrentFrame();
  const sendAt = beat(2);
  const paintAt = beat(4.5);
  const noneAt = beat(6.5);
  return (
    <Stack
      top={150}
      gap={80}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo name="react" size={34} />
            <Eyebrow>Hydrate</Eyebrow>
          </div>
          <Title size={104} align="center" delay={4}>
            No second fetch.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Caption>Server</Caption>
              <CodeWindow file="page.tsx" code={SERVER_CODE} lineNumbers={false} fontSize={21} width={960} delay={beat(0.5)} marks={[{ lines: [1, 1], from: sendAt }]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Caption>Client</Caption>
              <CodeWindow file="users-list.tsx" code={CLIENT_CODE} lineNumbers={false} fontSize={21} width={960} delay={beat(2.5)} marks={[{ lines: [1, 1], from: paintAt - 10 }]} />
            </div>
          </div>
          <Bridge width={110} y1={110} y2={230} at={sendAt + 16} drawAt={beat(1.2)} />
          <AppWindow address="/users" footer="network" status="0 requests" statusAt={noneAt} statusTone="green" width={580} minHeight={320} at={beat(1)}>
            {frame < paintAt ? (
              <Skeleton />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {USERS.map((u, i) => (
                  <Row key={u} label={u} flashAt={paintAt + i * 2} value={<Mono color={color.zinc500}>#{i + 1}</Mono>} />
                ))}
              </div>
            )}
          </AppWindow>
          <Sfx at={sendAt} name="tick" volume={0.5} />
          <Sfx at={sendAt + 16} name="swish" volume={0.5} />
          <Sfx at={paintAt} name="pop" volume={0.65} />
          <Sfx at={noneAt} name="success" volume={0.38} />
        </div>
      }
    />
  );
};

/* ----------------------------------------------------------------------------------------------- retry */

const RETRY_CODE = `
retry: 5,
retryTime: exponentialBackoff({ min: 500, max: 10_000 }),
`;

/*
 * The attempts of one request in a devtools-style network list. The delays are illustrative, not measured: they
 * are plausible for min 500 and max 10_000 with jitter, roughly doubling from about half a second.
 */
const ATTEMPTS = [
  { label: "GET /reports/1", wait: "", status: "503", tone: "red" as const, time: "212 ms", at: beat(2) },
  { label: "retry 1", wait: "+0.6 s", status: "503", tone: "red" as const, time: "198 ms", at: beat(3.5) },
  { label: "retry 2", wait: "+1.4 s", status: "503", tone: "red" as const, time: "205 ms", at: beat(5) },
  { label: "retry 3", wait: "+2.9 s", status: "200", tone: "green" as const, time: "164 ms", at: beat(7) },
];

const Retry: React.FC = () => (
  <Stack
    top={150}
    gap={80}
    copy={
      <>
        <Eyebrow>Retry backoff</Eyebrow>
        <Title size={100} align="center" delay={4}>
          Retries that back off.
        </Title>
      </>
    }
    visual={
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ paddingTop: 110 }}>
          <CodeWindow file="report.ts" code={RETRY_CODE} fontSize={26} width={940} delay={beat(0.3)} marks={[{ lines: [2, 2], from: beat(1) }]} />
        </div>
        <Bridge width={90} y1={230} y2={200} at={beat(2) - 16} drawAt={beat(0.8)} />
        <AppWindow address="Network" footer="getReport" status="200 OK" statusAt={beat(7.5)} statusTone="green" width={640} minHeight={300} at={beat(0.6)} order={2}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ATTEMPTS.map((a) => (
              <React.Fragment key={a.label}>
                <Row
                  mono
                  label={a.label}
                  enterAt={a.at}
                  flashAt={a.tone === "green" ? a.at : undefined}
                  state={a.tone === "red" ? "error" : "idle"}
                  value={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 18 }}>
                      <Mono size={20} color={color.bolt}>
                        {a.wait}
                      </Mono>
                      <Mono size={20} color={color.zinc500}>
                        {a.time}
                      </Mono>
                      <Status code={a.status} tone={a.tone} />
                    </span>
                  }
                />
                <Sfx at={a.at} name={a.tone === "green" ? "success" : "tick"} volume={a.tone === "green" ? 0.38 : 0.45} />
              </React.Fragment>
            ))}
          </div>
        </AppWindow>
      </div>
    }
  />
);

/* ----------------------------------------------------------------------------------------------- offline */

const QUEUE_CODE = `
lazyStorage: {
  set: (key, data) => set(key, data, store),
  get: (key) => get(key, store),
  keys: async () => (await keys(store)).map(String),
  delete: (key) => del(key, store),
},
`;

const Offline: React.FC = () => {
  const frame = useCurrentFrame();
  const queued = [
    { label: "PATCH /todos/1", at: beat(1.5) },
    { label: "POST /todos", at: beat(2.5) },
    { label: "DELETE /todos/7", at: beat(3.5) },
  ];
  const reloadAt = beat(5);
  const restoredAt = beat(6);
  const onlineAt = beat(7);
  const replayedAt = onlineAt + beat(3) - 30;
  const reloading = frame >= reloadAt && frame < restoredAt;
  const online = frame >= onlineAt;
  return (
    <Stack
      top={160}
      gap={90}
      copy={
        <>
          <Eyebrow>Offline queues</Eyebrow>
          <Title size={100} align="center" delay={4}>
            Queued writes survive reloads.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ paddingTop: 10 }}>
            <CodeWindow file="client.ts" code={QUEUE_CODE} fontSize={23} width={940} delay={beat(0.3)} marks={[{ lines: [1, 1], from: beat(1) }]} />
          </div>
          <Bridge width={100} y1={130} y2={200} at={beat(1.5) - 16} drawAt={beat(0.8)} />
          <AppWindow
            address={reloading ? "reloading…" : "/todos"}
            footer="network"
            status="3 replayed"
            statusAt={replayedAt}
            statusTone="green"
            width={640}
            minHeight={250}
            at={beat(0.6)}
            order={2}
            headerRight={
              <>
                <Dot tone={online ? "green" : reloading ? "gold" : "zinc"} /> {online ? "online" : "offline"}
              </>
            }
          >
            {reloading ? (
              <Skeleton rows={3} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {queued.map((q, i) => {
                  const sentAt = onlineAt + beat(0.5 + i) - 30;
                  const sent = frame >= sentAt;
                  const restored = frame >= restoredAt;
                  return (
                    <Row
                      key={q.label}
                      mono
                      enterAt={restored ? restoredAt + i * 4 : q.at}
                      flashAt={sent ? sentAt : undefined}
                      label={q.label}
                      value={<Status code={sent ? "200" : restored ? "restored" : "queued"} tone={sent ? "green" : restored ? "blue" : "gold"} />}
                    />
                  );
                })}
              </div>
            )}
          </AppWindow>
          {queued.map((q, i) => (
            <React.Fragment key={q.label}>
              <Sfx at={q.at} name="tick" volume={0.5} />
              <Sfx at={onlineAt + beat(0.5 + i) - 30} name="pop" volume={0.5} />
            </React.Fragment>
          ))}
          <Sfx at={reloadAt} name="glitch" volume={0.5} />
          <Sfx at={restoredAt} name="swish" volume={0.45} />
          <Sfx at={replayedAt} name="success" volume={0.38} />
        </div>
      }
    />
  );
};

/* ----------------------------------------------------------------------------------------------- more */

const BLOB_CODE = `
const downloadAvatar = client.createRequest<{ response: Blob }>()({
  endpoint: "/users/:userId/avatar",
  options: { responseType: "blob" },
});
`;

/* What an image looks like when it is decoded as text: the PNG signature and chunk names in mojibake */
const GARBLED = "‰PNG␚ IHDR ä½¥Ì ÿØÿà JFIF ïÂ IDATx ºÞ×ÿ ±Ñ ê IEND®B`‚";

/* A profile page: the avatar arrives as text and shows as noise, then responseType "blob" and it renders */
const Avatar: React.FC<{ fixAt: number }> = ({ fixAt }) => {
  const frame = useCurrentFrame();
  const fixed = frame >= fixAt;
  const k = fixed ? progress(frame, fixAt, sec(0.5), outQuint) : 0;
  return (
    <div style={{ position: "relative", width: 220, height: 220, borderRadius: 999, overflow: "hidden", flexShrink: 0, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.1)" }}>
      {/* The broken version: the bytes as characters */}
      <div style={{ position: "absolute", inset: 0, padding: 26, background: "rgba(244,63,94,0.06)", fontFamily: mono, fontSize: 17, lineHeight: 1.3, color: "#fb7185", wordBreak: "break-all", opacity: 1 - k }}>
        {GARBLED.repeat(3)}
      </div>
      {/* The real image: a portrait drawn in gold */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: k,
          transform: `scale(${1.15 - 0.15 * k})`,
          background: "radial-gradient(circle at 50% 38%, #ffe08a 0 22%, transparent 23%), radial-gradient(ellipse 60% 42% at 50% 92%, #f5a623 0 70%, transparent 71%), linear-gradient(160deg, #3a2a10, #1b1b1d)",
        }}
      />
    </div>
  );
};

const More: React.FC = () => {
  const frame = useCurrentFrame();
  const fixAt = beat(5);
  return (
    <Stack
      top={120}
      gap={70}
      visualScale={1.05}
      copy={
        <>
          <Eyebrow>Binary downloads</Eyebrow>
          <Title size={104} align="center" delay={4}>
            Images arrive as images.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 110 }}>
          <CodeWindow file="avatar.ts" code={BLOB_CODE} fontSize={22} width={880} delay={beat(0.3)} marks={[{ lines: [3, 3], from: fixAt - 24 }]} />
          <svg width={110} height={10} style={{ position: "absolute", left: 880, top: "50%", overflow: "visible" }}>
            <Beam x1={0} y1={0} x2={110} y2={0} at={fixAt - 20} drawAt={beat(1)} />
          </svg>
          <AppWindow
            address="/profile/ada"
            footer="GET /users/1/avatar"
            status={fixed(frame, fixAt) ? "image/png · Blob" : "decoded as text"}
            statusAt={beat(2)}
            statusTone={fixed(frame, fixAt) ? "green" : "red"}
            width={600}
            minHeight={0}
            at={beat(0.6)}
            order={2}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
              <Avatar fixAt={fixAt} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontFamily: body, fontWeight: 700, fontSize: 34, color: color.zinc100 }}>Ada Lovelace</span>
                <span style={{ fontFamily: body, fontSize: 22, color: color.zinc500 }}>@ada · London</span>
              </div>
            </div>
          </AppWindow>
          <Sfx at={beat(2)} name="glitch" volume={0.4} />
          <Sfx at={fixAt - 20} name="swish" volume={0.45} />
          <Sfx at={fixAt} name="success" volume={0.4} />
        </div>
      }
    />
  );
};

const fixed = (frame: number, at: number) => frame >= at;

const LOGOS = [
  { logo: "hyper-fetch", label: "@hyper-fetch/core" },
  { logo: "react", label: "@hyper-fetch/react" },
];

export const coreReactVideo: VideoDefinition = {
  id: "CoreAndReact",
  post: "hyper-fetch-10-core-react",
  pattern: "crosses",
  mask: "top",
  scenes: [
    { id: "hook", node: <Hook words={["Snapshot.", "Write.", "Rollback.", "Refetch."]} line="Optimistic UI, without the boilerplate." gold={["Optimistic"]} /> },
    {
      id: "intro",
      node: <Intro title="Core and React in v10" description="Optimistic. Infinite. Hydrated. Hardened." gold={["v10"]} titleSize={136} logos={LOGOS} />,
    },
    { id: "optimistic", node: <Optimistic /> },
    { id: "infinite", node: <Infinite /> },
    { id: "hydrate", node: <Hydrate /> },
    { id: "retry", node: <Retry /> },
    { id: "offline", node: <Offline /> },
    { id: "more", node: <More /> },
    { id: "slam-instant", node: <Slam first="Instant" second="UI." /> },
    { id: "slam-never", node: <Slam first="Never lose" second="a write." /> },
    { id: "outro", node: <Outro install="npm install @hyper-fetch/core@10 @hyper-fetch/react@10" post="hyper-fetch-10-core-react" logos={LOGOS} /> },
  ],
};

