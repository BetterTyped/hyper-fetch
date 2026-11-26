import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, deal, pop, progress, rise, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Split, Stack } from "../brand/Timeline";
import { body, color, mono } from "../brand/tokens";
import { Card, Chip, Eyebrow, LogoChip, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";
import { Outro } from "../scenes/Outro";
import { AppWindow, Skeleton } from "../visuals/app";
import { Beam, EventPill, Mono, Panel, Row, StatusDot, Swap, TypingSfx } from "../visuals/common";

/*
 * Introducing HyperFetch DB: one record, many copies → collections, queries that pick their request, live lists,
 * ordered writes, optimistic writes and the offline outbox. Every hit sits on the beat grid (see motion.beat).
 */

const ManyCopies: React.FC = () => {
  const frame = useCurrentFrame();
  const landAt = beat(4);
  const staleAt = beat(6);
  const caches = [
    { title: "GET /teams/1/posts", others: ["Release notes", "Roadmap"] },
    { title: "GET /posts/1", others: [] },
    { title: "GET /feed", others: ["Weekly digest"] },
  ];
  return (
    <Stack
      top={130}
      gap={90}
      visualScale={1.1}
      copy={
        <>
          <Eyebrow>The problem</Eyebrow>
          <Title size={112} align="center" delay={4}>
            One record, many copies.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", gap: 36 }}>
          {caches.map((c, i) => (
            <Panel
              key={c.title}
              width={480}
              delay={beat(0.5) + i * 6}
              title={<Mono size={22}>{c.title}</Mono>}
              badge={
                i > 0 && frame >= staleAt ? (
                  <span style={{ transform: `scale(${pop(frame, staleAt + (i - 1) * 8)})`, display: "inline-block" }}>
                    <Chip tone="red" size={18}>
                      stale
                    </Chip>
                  </span>
                ) : (
                  <Chip size={18}>cached</Chip>
                )
              }
            >
              <Row
                label="Post 1"
                state={i > 0 && frame >= staleAt ? "stale" : "idle"}
                flashAt={i === 0 ? landAt : undefined}
                value={
                  i === 0 ? (
                    <Mono color={color.zinc100}>
                      <Swap from={'"Draft"'} to={'"Final"'} at={landAt} />
                    </Mono>
                  ) : (
                    <Mono color={frame >= staleAt ? "#fb7185" : color.zinc100}>"Draft"</Mono>
                  )
                }
              />
              {c.others.map((o) => (
                <Row key={o} label={o} value={<Mono color={color.zinc500}>…</Mono>} />
              ))}
            </Panel>
          ))}
          <EventPill at={landAt - 30} fromX={-380} toX={20} y={-50}>
            event · post 1 title = "Final"
          </EventPill>
          <Sfx at={landAt - 30} name="swish" volume={0.6} />
          <Sfx at={landAt} name="pop" volume={0.7} />
          <Sfx at={staleAt} name="error" volume={0.45} />
          <Sfx at={staleAt + 8} name="error" volume={0.35} />
        </div>
      }
    />
  );
};

const OnceEverywhere: React.FC = () => {
  const frame = useCurrentFrame();
  const hubAt = beat(4);
  const views = [
    { name: "Team list", y: 30 },
    { name: "Post page", y: 245 },
    { name: "Popular", y: 460 },
  ];
  const hub = { x: 30, y: 215, w: 420 };
  return (
    <Split
      copyWidth={520}
      gap={40}
      visualScale={1.12}
      copy={
        <>
          <Eyebrow>Collections</Eyebrow>
          <Title size={104} delay={4}>
            Store each record once.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1000, height: 590 }}>
          <svg width={1000} height={590} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {views.map((v, i) => (
              <Beam key={v.name} x1={hub.x + hub.w} y1={hub.y + 82} x2={590} y2={v.y + 58} at={hubAt + 6 + i * 4} curve={(1 - i) * 36} dim={0.22} />
            ))}
          </svg>
          <div style={{ position: "absolute", left: hub.x, top: hub.y, width: hub.w, ...deal(frame, beat(0.3), 0, 160) }}>
            <Card radius={20} glow bezel sheenAt={beat(0.3) + 30} ring={frame >= hubAt ? Math.max(0, 1 - (frame - hubAt) / 40) : 0} style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Mono size={26} color={color.bolt}>
                  db.post
                </Mono>
                <span style={{ marginLeft: "auto" }}>
                  <Chip tone="gold" size={17}>
                    1 row per id
                  </Chip>
                </span>
              </div>
              <Row
                mono
                label="#1 title"
                flashAt={hubAt}
                value={
                  <Mono color={color.zinc100}>
                    <Swap from='"Draft"' to='"Final"' at={hubAt} />
                  </Mono>
                }
              />
            </Card>
          </div>
          {views.map((v, i) => (
            <div key={v.name} style={{ position: "absolute", left: 590, top: v.y, width: 400, ...deal(frame, beat(0.6) + i * 6, i + 1, 160) }}>
              <Card radius={18} bezel sheenAt={beat(0.6) + i * 6 + 30} ring={frame >= beat(5) + i * 8 ? Math.max(0, 1 - (frame - beat(5) - i * 8) / 36) : 0} style={{ padding: "16px 22px" }}>
                <div style={{ fontFamily: body, fontSize: 20, color: color.zinc500, marginBottom: 8 }}>{v.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: body, fontSize: 28, color: color.zinc100 }}>
                  Post 1 ·
                  <Mono size={26} color={color.zinc100}>
                    <Swap from='"Draft"' to='"Final"' at={beat(5) + i * 8} />
                  </Mono>
                </div>
              </Card>
              <Sfx at={beat(5) + i * 8} name="tick" volume={0.55} />
            </div>
          ))}
          <EventPill at={hubAt - 30} fromX={-280} toX={hub.x + 50} y={hub.y - 64}>
            socket event · post 1
          </EventPill>
          <Sfx at={hubAt - 30} name="swish" volume={0.6} />
          <Sfx at={hubAt} name="pop" volume={0.7} />
          <Sfx at={beat(6)} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

const COLLECTION = `
const Post = collection(PostSchema, { key: "id", version: "updatedAt" })
  .load(getPost, { byKey: (id) => ({ params: { postId: id } }) })
  .sync(onPostChanged, { type: "update" });
`;

const CollectionCode: React.FC = () => {
  const typeFrom = beat(0.5);
  return (
    <Split
      copyWidth={520}
      gap={60}
      visualScale={1.06}
      copy={
        <>
          <Eyebrow>Typed collections</Eyebrow>
          <Title size={96} delay={4}>
            Loaded by your requests.
          </Title>
        </>
      }
      visual={
        <>
          <CodeWindow
            file="db.ts"
            code={COLLECTION}
            fontSize={24}
            width={1040}
            delay={4}
            typeFrom={typeFrom}
            cps={60}
            marks={[
              { lines: [2, 2], from: beat(6), until: beat(9) },
              { lines: [3, 3], from: beat(9) },
            ]}
          />
          <TypingSfx from={typeFrom} chars={COLLECTION.trim().length} cps={60} />
          <Sfx at={beat(6)} name="tick" volume={0.5} />
          <Sfx at={beat(9)} name="pop" volume={0.6} />
        </>
      }
    />
  );
};

const QUERY = `
const popular = db.post
  .where((post) => and(eq(post.teamId, teamId), gt(post.likes, 10)))
  .orderBy((post) => post.createdAt, "desc");

const { data, status } = useLiveQuery(popular);
`;

/* The posts the query sees: the server returns the team's posts, likes > 10 runs on the client */
const TEAM_POSTS = [
  { title: "Release notes", likes: 48 },
  { title: "Roadmap 2027", likes: 12 },
  { title: "Team offsite", likes: 9 },
  { title: "Old announcement", likes: 3 },
];

const PicksRequest: React.FC = () => {
  const frame = useCurrentFrame();
  const sendAt = beat(3);
  const rowsAt = beat(4.5);
  const filterAt = beat(6.5);
  return (
    <Stack
      top={100}
      gap={60}
      visualScale={0.92}
      copy={
        <>
          <Eyebrow>Smart queries</Eyebrow>
          <Title size={108} align="center" delay={4}>
            Query data, not endpoints.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 110 }}>
          <CodeWindow file="popular-posts.tsx" code={QUERY} fontSize={21} width={1010} delay={beat(0.2)} marks={[{ lines: [2, 2], from: sendAt - 20, until: rowsAt }, { lines: [5, 5], from: rowsAt }]} />
          <svg width={110} height={700} style={{ position: "absolute", left: 1010, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={318} x2={110} y2={110} at={sendAt} drawAt={sendAt - 30} />
            <Beam x1={0} y1={420} x2={110} y2={470} at={rowsAt} drawAt={rowsAt - 30} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <AppWindow address="network" at={beat(1)} order={2} width={560} minHeight={0} footer="server" status="1 request" statusAt={sendAt + 30} statusTone="gold">
              <Row
                mono
                label="GET /teams/1/posts"
                enterAt={sendAt + 20}
                value={frame >= sendAt + 40 ? <Chip tone="green" size={17}>200</Chip> : <Mono color={color.zinc500}>…</Mono>}
              />
            </AppWindow>
            <AppWindow address="Popular posts" at={beat(1.5)} order={4} width={560} minHeight={0} footer="client" status="likes > 10" statusAt={filterAt} statusTone="blue">
              {frame < rowsAt ? (
                <Skeleton rows={4} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {TEAM_POSTS.map((post, i) => (
                    <Row
                      key={post.title}
                      label={post.title}
                      flashAt={rowsAt + i * 3}
                      exitAt={post.likes <= 10 ? filterAt + (i - 2) * 6 : undefined}
                      value={<Mono color={post.likes > 10 ? color.zinc300 : color.zinc600}>{post.likes} likes</Mono>}
                    />
                  ))}
                </div>
              )}
            </AppWindow>
          </div>
          <Sfx at={sendAt} name="swish" volume={0.5} />
          <Sfx at={sendAt + 40} name="tick" volume={0.5} />
          <Sfx at={rowsAt} name="pop" volume={0.6} />
          <Sfx at={filterAt} name="glitch" volume={0.35} />
        </div>
      }
    />
  );
};

const LiveList: React.FC = () => {
  const frame = useCurrentFrame();
  const insertAt = beat(4);
  const updateAt = beat(8);
  const deleteAt = beat(12);
  return (
    <Split
      copyWidth={660}
      visualScale={1.2}
      copy={
        <>
          <Eyebrow>Socket events</Eyebrow>
          <Title size={120} delay={4}>
            Live by default.
          </Title>
          <div style={{ marginTop: 18, ...rise(frame, beat(0.6)) }}>
            <CodeWindow
              file="db.ts"
              lineNumbers={false}
              glow={false}
              fontSize={21}
              width={660}
              code={`.sync(onPostCreated, { type: "insert", where: byTeam })
.sync(onPostChanged, { type: "update", where: byTeam })
.sync(onPostDeleted, { type: "delete", where: byTeam });`}
              marks={[
                { lines: [1, 1], from: insertAt - 30, until: updateAt - 30 },
                { lines: [2, 2], from: updateAt - 30, until: deleteAt - 30 },
                { lines: [3, 3], from: deleteAt - 30 },
              ]}
            />
          </div>
        </>
      }
      visual={
        <div style={{ position: "relative" }}>
          <Panel
            width={660}
            delay={beat(0.3)}
            title={<Mono size={24}>useLiveQuery(teamPosts)</Mono>}
            badge={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: body, fontSize: 20, color: color.green }}>
                <StatusDot tone="green" /> live
              </span>
            }
          >
            <Row label="Shipping HyperFetch 10" enterAt={insertAt} flashAt={insertAt} value={<Chip tone="gold" size={17}>new</Chip>} />
            <Row label={<Swap from="Roadmap draft" to="Roadmap 2027" at={updateAt} />} flashAt={updateAt} value={<Mono color={color.zinc500}>12 likes</Mono>} />
            <Row label="Release notes" value={<Mono color={color.zinc500}>48 likes</Mono>} />
            <Row label="Old announcement" exitAt={deleteAt} value={<Mono color={color.zinc500}>3 likes</Mono>} />
            <Row label="Team offsite" value={<Mono color={color.zinc500}>9 likes</Mono>} />
          </Panel>
          <EventPill at={insertAt - 30} fromX={640} toX={430} y={-60}>
            insert · post 7
          </EventPill>
          <EventPill at={updateAt - 30} fromX={640} toX={430} y={-60} tone="blue">
            update · post 2
          </EventPill>
          <EventPill at={deleteAt - 30} fromX={640} toX={430} y={-60} tone="red">
            delete · post 4
          </EventPill>
          {[insertAt, updateAt, deleteAt].map((at) => (
            <React.Fragment key={at}>
              <Sfx at={at - 30} name="swish" volume={0.5} />
              <Sfx at={at} name={at === deleteAt ? "glitch" : "pop"} volume={0.55} />
            </React.Fragment>
          ))}
        </div>
      }
    />
  );
};

const RaceStep: React.FC<{ x: number; at: number; label: string; detail: string; tone: "zinc" | "gold" | "red" }> = ({ x, at, label, detail, tone }) => {
  const frame = useCurrentFrame();
  const s = pop(frame, at, 13);
  const c = tone === "gold" ? color.bolt : tone === "red" ? color.red : color.zinc400;
  return (
    <div style={{ position: "absolute", left: x - 180, top: 0, width: 360, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, s) }}>
      <div style={{ width: 24, height: 24, borderRadius: 99, background: c, boxShadow: `0 0 24px ${c}`, transform: `scale(${s})` }} />
      <div style={{ marginTop: 24, fontFamily: mono, fontSize: 26, color: color.zinc100, textAlign: "center" }}>{label}</div>
      <div style={{ marginTop: 8, fontFamily: body, fontSize: 23, color: color.zinc500, textAlign: "center" }}>{detail}</div>
      <Sfx at={at} name="tick" volume={0.55} />
    </div>
  );
};

const LateResponse: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = beat(1);
  const t1 = beat(3);
  const t2 = beat(5);
  const rejectAt = beat(6);
  const line = progress(frame, beat(0.5), beat(5) - beat(0.5));
  const reject = progress(frame, rejectAt, sec(0.45));
  return (
    <Stack
      top={150}
      gap={130}
      visualScale={1.2}
      copy={
        <>
          <Eyebrow>Ordered writes</Eyebrow>
          <Title size={112} align="center" delay={4}>
            Late responses cannot win.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1440, height: 420 }}>
          <div style={{ position: "absolute", left: 100, right: 100, top: 11, height: 2, background: "rgba(255,255,255,0.08)" }} />
          <div
            style={{
              position: "absolute",
              left: 100,
              top: 11,
              height: 2,
              width: 1240 * line,
              background: `linear-gradient(to right, transparent, ${color.bolt})`,
              boxShadow: "0 0 14px rgba(251,198,70,0.7)",
            }}
          />
          <RaceStep x={260} at={t0} label="GET /teams/t1/posts" detail="refetch sent" tone="zinc" />
          <RaceStep x={720} at={t1} label='event: title = "Final"' detail="arrives first" tone="gold" />
          <RaceStep x={1180} at={t2} label='response: "Draft"' detail="read before the edit" tone="red" />
          <div style={{ position: "absolute", left: 0, right: 0, top: 236, display: "flex", justifyContent: "center", ...rise(frame, t1 + 10) }}>
            <Card radius={24} glow style={{ padding: "28px 44px", display: "flex", alignItems: "center", gap: 28 }}>
              <span style={{ fontFamily: body, fontSize: 28, color: color.zinc400 }}>post 1 title</span>
              <Mono size={36} color={color.zinc50}>
                <Swap from='"Draft"' to='"Final"' at={t1 + 10} />
              </Mono>
              {frame >= rejectAt && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 16, opacity: reject }}>
                  <span style={{ position: "relative", fontFamily: mono, fontSize: 30, color: "#fb7185", opacity: 1 - reject * 0.4 }}>
                    "Draft"
                    <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 3, background: color.red, transform: `scaleX(${reject})`, transformOrigin: "left" }} />
                  </span>
                  <Chip tone="red" size={19}>
                    older, ignored
                  </Chip>
                </span>
              )}
            </Card>
          </div>
          <Sfx at={rejectAt} name="error" volume={0.5} />
        </div>
      }
    />
  );
};

const OPTIMISTIC = `
await db.post.update(id, { title: "Renamed" });
`;

const Optimistic: React.FC = () => {
  const frame = useCurrentFrame();
  const clickAt = beat(3);
  const failAt = beat(7);
  const pending = frame >= clickAt && frame < failAt;
  return (
    <Stack
      top={150}
      gap={120}
      visualScale={1.08}
      copy={
        <>
          <Eyebrow>Optimistic writes</Eyebrow>
          <Title size={120} align="center" delay={4}>
            No rollback code.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
          <CodeWindow file="post-row.tsx" code={OPTIMISTIC} fontSize={26} width={860} delay={beat(0.2)} marks={[{ lines: [1, 1], from: clickAt - 20 }]} />
          <div style={rise(frame, beat(0.5))}>
            <Panel
              width={540}
              title="Team posts"
              badge={pending ? <Chip tone="gold" size={17}>pending</Chip> : frame >= failAt ? <Chip tone="red" size={17}>reverted</Chip> : undefined}
            >
              <Row label={<Swap from="Roadmap 2027" to="Renamed" at={clickAt} back={failAt} />} state={pending ? "pending" : "idle"} flashAt={clickAt} value={<Mono color={color.zinc500}>12 likes</Mono>} />
              <Row label="Release notes" value={<Mono color={color.zinc500}>48 likes</Mono>} />
            </Panel>
            {frame >= failAt && (
              <div style={{ marginTop: 22, ...rise(frame, failAt, 14) }}>
                <Chip tone="red" size={20}>
                  request failed · reverted
                </Chip>
              </div>
            )}
          </div>
          <Sfx at={clickAt} name="pop" volume={0.7} />
          <Sfx at={failAt} name="error" volume={0.5} />
        </div>
      }
    />
  );
};

const Outbox: React.FC = () => {
  const frame = useCurrentFrame();
  const writes = [
    { label: "insert post", at: beat(1.5) },
    { label: "insert comment", at: beat(2.5) },
    { label: "update post title", at: beat(3.5) },
  ];
  const restartAt = beat(6);
  const onlineAt = beat(8);
  const flash = Math.max(0, 1 - Math.abs(frame - restartAt) / 10);
  const online = frame >= onlineAt;
  return (
    <Split
      copyWidth={600}
      visualScale={1.2}
      copy={
        <>
          <Eyebrow>Offline outbox</Eyebrow>
          <Title size={110} delay={4}>
            Writes survive restarts.
          </Title>
          <div style={{ marginTop: 14, ...rise(frame, beat(0.6)) }}>
            <CodeWindow
              file="db.ts"
              glow={false}
              lineNumbers={false}
              fontSize={22}
              width={600}
              code={`createDb(collections, { offline: true });`}
              marks={[{ lines: [1, 1], from: beat(1) }]}
            />
          </div>
        </>
      }
      visual={
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -2000, background: "white", opacity: flash * 0.07, pointerEvents: "none" }} />
          <Panel
            width={700}
            delay={beat(0.3)}
            title="Outbox"
            badge={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: body, fontSize: 20, color: online ? color.green : color.zinc400 }}>
                <StatusDot tone={online ? "green" : "zinc"} /> {online ? "online, replaying" : frame >= restartAt ? "restarted, offline" : "offline"}
              </span>
            }
          >
            {writes.map((w, i) => {
              const sentAt = onlineAt + beat(1 + i) - 30;
              const sent = frame >= sentAt;
              return (
                <React.Fragment key={w.label}>
                  <Row
                    enterAt={w.at}
                    flashAt={sent ? sentAt : undefined}
                    label={
                      <span>
                        <span style={{ color: color.zinc500, marginRight: 14 }}>{i + 1}</span>
                        {w.label}
                      </span>
                    }
                    value={sent ? <Chip tone="green" size={17}>sent</Chip> : <Chip tone="gold" size={17}>stored</Chip>}
                  />
                  <Sfx at={w.at} name="tick" volume={0.5} />
                  <Sfx at={sentAt} name="pop" volume={0.55} />
                </React.Fragment>
              );
            })}
          </Panel>
          {frame >= restartAt && (
            <div style={{ position: "absolute", top: -72, right: 0, ...rise(frame, restartAt, 10) }}>
              <Chip size={19}>↻ restarted</Chip>
            </div>
          )}
          <div style={{ position: "absolute", bottom: -72, left: 0, opacity: interpolate(frame, [onlineAt, onlineAt + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <Mono size={21} color={color.zinc500}>
              replayed in order
            </Mono>
          </div>
          <Sfx at={restartAt} name="glitch" volume={0.5} />
          <Sfx at={onlineAt + beat(3) - 30} name="success" volume={0.4} />
        </div>
      }
    />
  );
};

const RESOURCE = `
const Post = collection(PostSchema, { key: "id", version: "updatedAt" })
  .resource(sdk.posts, { item: "$postId", list: { where: ["status"] } });
`;

const FIRESTORE = `
const Post = firestoreCollection(PostSchema, { client, socket, path: "posts", key: "id" });
`;

/* What .resource() reads from a typed SDK, as the post lists it */
const OPERATIONS = ["GET /posts", "GET /posts/:postId", "POST /posts", "PATCH /posts/:postId", "DELETE /posts/:postId"];

const Sources: React.FC = () => {
  const frame = useCurrentFrame();
  const opsAt = beat(3);
  return (
    <Stack
      top={120}
      gap={60}
      visualScale={0.96}
      copy={
        <>
          <Eyebrow>From your SDK</Eyebrow>
          <Title size={108} align="center" delay={4}>
            One line. A whole collection.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 110 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, ...rise(frame, beat(0.4)) }}>
                {[
                  ["openapi", "OpenAPI"],
                  ["hono", "Hono"],
                  ["elysia", "Elysia"],
                ].map(([logo, label]) => (
                  <LogoChip key={logo} logo={logo} size={20}>
                    {label}
                  </LogoChip>
                ))}
              </div>
              <CodeWindow file="db.ts" code={RESOURCE} lineNumbers={false} fontSize={19} width={1080} delay={beat(0.2)} marks={[{ lines: [2, 2], from: opsAt - 20 }]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={rise(frame, beat(6))}>
                <LogoChip logo="firebase" size={20}>
                  Firestore
                </LogoChip>
              </div>
              <CodeWindow file="db.ts" code={FIRESTORE} lineNumbers={false} fontSize={19} width={1080} delay={beat(6)} marks={[{ lines: [1, 1], from: beat(7) }]} />
            </div>
          </div>
          <svg width={110} height={560} style={{ position: "absolute", left: 1080, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={128} x2={110} y2={250} at={opsAt} drawAt={opsAt - 30} />
            <Beam x1={0} y1={420} x2={110} y2={330} at={beat(7)} drawAt={beat(6.5)} />
          </svg>
          <AppWindow address="db.post" at={beat(1)} order={4} width={520} minHeight={0} footer="from one call" status="5 operations" statusAt={opsAt + 5 * 12 + 10} statusTone="gold">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OPERATIONS.map((op, i) => (
                <React.Fragment key={op}>
                  <Row mono label={op} enterAt={opsAt + 10 + i * 12} flashAt={opsAt + 10 + i * 12} />
                  <Sfx at={opsAt + 10 + i * 12} name="tick" volume={0.45} />
                </React.Fragment>
              ))}
            </div>
          </AppWindow>
          <Sfx at={opsAt} name="swish" volume={0.5} />
        </div>
      }
    />
  );
};

/* 90 seeds of 40 random steps each, from the post's "How we tested it" */
const SEEDS = 90;

const Tested: React.FC = () => {
  const frame = useCurrentFrame();
  const runAt = beat(2);
  const per = 2.6;
  const doneAt = runAt + Math.round(SEEDS * per);
  return (
    <Stack
      top={120}
      gap={60}
      visualScale={1.1}
      copy={
        <>
          <Eyebrow>Correct under races</Eyebrow>
          <Title size={108} align="center" delay={4}>
            Never a value the server lacks.
          </Title>
        </>
      }
      visual={
        <AppWindow
          address="db.model.spec.ts"
          headerRight={<span style={{ fontFamily: mono, fontSize: 19, color: color.zinc400 }}>40 random steps each</span>}
          at={beat(0.6)}
          order={2}
          width={1180}
          minHeight={0}
          footer="once settled"
          status="client = server"
          statusAt={doneAt + 10}
          statusTone="green"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: 10 }}>
            {Array.from({ length: SEEDS }, (_, i) => {
              const at = runAt + Math.round(i * per);
              const done = frame >= at;
              const k = done ? Math.max(0, 1 - (frame - at) / 14) : 0;
              return (
                <div
                  key={i}
                  style={{
                    height: 52,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: mono,
                    fontSize: 17,
                    color: done ? color.green : color.zinc600,
                    background: done ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.025)",
                    boxShadow: done ? `inset 0 0 0 1px rgba(52,211,153,${0.25 + k * 0.5}), 0 0 ${k * 24}px rgba(52,211,153,${k * 0.5})` : "inset 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          {[0, 15, 30, 45, 60, 75, 89].map((i) => (
            <Sfx key={i} at={runAt + Math.round(i * per)} name="tick" volume={0.35} />
          ))}
          <Sfx at={doneAt + 10} name="success" volume={0.4} />
        </AppWindow>
      }
    />
  );
};

export const dbVideo: VideoDefinition = {
  id: "HyperFetchDB",
  post: "hyper-fetch-db",
  pattern: "flickering",
  mask: "radial",
  scenes: [
    { id: "hook", node: <Hook words={["Fetch.", "Cache.", "Copy.", "Stale."]} line="Every response keeps its own copy." gold={["own", "copy."]} /> },
    {
      id: "intro",
      node: <Intro title="Introducing HyperFetch DB" description="Store each record once. Show it live everywhere." pill="Beta" gold={["DB"]} titleSize={124} logos={[
        { logo: "db", label: "HyperFetch DB" },
        { logo: "react", label: "React" },
        { logo: "sockets", label: "Sockets" },
        { logo: "firebase", label: "Firestore" },
      ]} />,
    },
    { id: "many-copies", node: <ManyCopies /> },
    { id: "slam-once", node: <Slam first="Store it" second="once." /> },
    { id: "once", node: <OnceEverywhere /> },
    { id: "collection", node: <CollectionCode /> },
    { id: "query", node: <PicksRequest /> },
    { id: "slam-live", node: <Slam first="Every view." second="Live." /> },
    { id: "live", node: <LiveList /> },
    { id: "late", node: <LateResponse /> },
    { id: "slam-instant", node: <Slam first="Instant" second="writes." /> },
    { id: "optimistic", node: <Optimistic /> },
    { id: "outbox", node: <Outbox /> },
    { id: "slam-zero", node: <Slam first="Zero" second="boilerplate." /> },
    { id: "sources", node: <Sources /> },
    { id: "tested", node: <Tested /> },
    {
      id: "outro",
      node: <Outro install="npm install @hyper-fetch/db" post="hyper-fetch-db" logos={[{ logo: "db", label: "DB" }, { logo: "react", label: "React" }, { logo: "sockets", label: "Sockets" }]} />,
    },
  ],
};
