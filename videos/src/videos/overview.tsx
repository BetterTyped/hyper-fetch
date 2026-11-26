import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, outExpo, pop, progress, rise, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Split, Stack } from "../brand/Timeline";
import { body, clipText, color, display, mono, titleGradient } from "../brand/tokens";
import { Card, Chip, Eyebrow, Logo, LogoChip, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";
import { ChartCard, Spark } from "../visuals/charts";
import { TEST_GROWTH } from "../data/tests";

import { Outro } from "../scenes/Outro";
import { Mono, Panel, Row, StatusDot, Swap } from "../visuals/common";
import { Counter, Icon, LogoRow, Tag } from "../visuals/extra";

/* HyperFetch 10: the release in one minute, a beat per highlight */

/*
 * What's new, as a roll call: each of the eight highlights gets its own moment on the beat. A big logo tile and the
 * name slam in, the previous one lifts away, and the logo row underneath lights the one being shown. Nothing is
 * small, nothing is cramped, and each name has the whole frame.
 */
const HIGHLIGHTS: { logos: string[]; title: string; tag?: { label: string; tone: "gold" | "red" } }[] = [
  { logos: ["db"], title: "HyperFetch DB", tag: { label: "Beta", tone: "gold" } },
  { logos: ["trpc", "orpc", "hono", "elysia"], title: "Typed backends" },
  { logos: ["hyper-fetch"], title: "Optimistic updates" },
  { logos: ["react"], title: "Infinite lists" },
  { logos: ["sockets"], title: "Sockets that recover" },
  { logos: ["graphql"], title: "Typed GraphQL" },
  { logos: ["firebase"], title: "Typed Firebase" },
  { logos: ["oxlint"], title: "Oxlint plugin" },
];

const STEP = 52;

const HighlightTile: React.FC<{ logos: string[] }> = ({ logos }) => (
  <div
    style={{
      width: 230,
      height: 230,
      borderRadius: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(to bottom, #26262a, #1b1b1d)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 10px rgba(255,255,255,0.025), 0 40px 90px -30px rgba(0,0,0,0.9), 0 0 120px -30px rgba(251,198,70,0.35)",
      flexShrink: 0,
    }}
  >
    {logos.length === 1 ? (
      <Logo name={logos[0]} size={118} />
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 76px)", gap: 18 }}>
        {logos.map((l) => (
          <div key={l} style={{ width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Logo name={l} size={64} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const Highlights: React.FC = () => {
  const frame = useCurrentFrame();
  const first = beat(0.5);
  const current = Math.max(0, Math.min(HIGHLIGHTS.length - 1, Math.floor((frame - first) / STEP)));
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Eyebrow>What's new in 10</Eyebrow>
      </div>

      {HIGHLIGHTS.map((h, i) => {
        const at = first + i * STEP;
        if (frame < at || i !== current) return null;
        const p = progress(frame, at, sec(0.32), outExpo);
        const leaving = i < HIGHLIGHTS.length - 1 ? progress(frame, at + STEP - 10, 10) : 0;
        return (
          <div
            key={h.title}
            style={{
              position: "absolute",
              top: 180,
              bottom: 250,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 70,
              opacity: p * (1 - leaving),
              filter: p < 1 || leaving > 0 ? `blur(${(1 - p) * 14 + leaving * 10}px)` : undefined,
              transform: `translateY(${leaving * -50}px) scale(${interpolate(p, [0, 1], [1.25, 1])})`,
            }}
          >
            <HighlightTile logos={h.logos} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22 }}>
              {h.tag && (
                <Chip tone={h.tag.tone} size={26}>
                  {h.tag.label}
                </Chip>
              )}
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: 130, lineHeight: 1, letterSpacing: "-0.045em", ...clipText(titleGradient), paddingBottom: "0.08em", whiteSpace: "nowrap" }}>
                {h.title}
              </div>
            </div>
            <Sfx at={at} name={i === 0 ? "impact" : "swish"} volume={i === 0 ? 0.3 : 0.45} />
          </div>
        );
      })}

      {/* The roll: every highlight's logo, lit once it has had its moment */}
      <div style={{ position: "absolute", bottom: 150, display: "flex", gap: 22, ...rise(frame, beat(0.5)) }}>
        {HIGHLIGHTS.map((h, i) => {
          const lit = frame >= first + i * STEP;
          const now = i === current && frame >= first;
          return (
            <div
              key={h.title}
              style={{
                width: 78,
                height: 78,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: now ? "rgba(251,198,70,0.1)" : "rgba(255,255,255,0.03)",
                boxShadow: now ? "inset 0 0 0 2px rgba(251,198,70,0.7), 0 0 40px rgba(245,166,35,0.35)" : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                opacity: lit ? 1 : 0.35,
              }}
            >
              <Logo name={h.logos[0]} size={38} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const DB_CODE = `
const { data } = useLiveQuery(db.post.where((p) => eq(p.teamId, 1)));
`;

const Db: React.FC = () => {
  const frame = useCurrentFrame();
  const eventAt = beat(7);
  return (
    <Split
      copyWidth={560}
      gap={60}
      visualScale={1.06}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoChip logo="db" tone="gold">
              HyperFetch DB
            </LogoChip>
            <Tag>Beta</Tag>
          </div>
          <Title size={100} delay={4}>
            A cache that stays live.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <CodeWindow file="posts.tsx" code={DB_CODE} fontSize={22} width={1000} delay={beat(0.1)} marks={[{ lines: [1, 1], from: beat(3) }]} />
          <div style={{ display: "flex", gap: 22, ...rise(frame, beat(4)) }}>
            {["Team list", "Post page", "Popular"].map((v, i) => (
              <Card key={v} radius={18} lit={false} style={{ flex: 1, padding: "16px 22px" }}>
                <div style={{ fontFamily: body, fontSize: 18, color: color.zinc500 }}>{v}</div>
                <div style={{ marginTop: 6, fontFamily: body, fontSize: 25, color: color.zinc100 }}>
                  Post 1 ·{" "}
                  <Mono size={23} color={color.zinc100}>
                    <Swap from='"Draft"' to='"Final"' at={eventAt + i * 3} />
                  </Mono>
                </div>
              </Card>
            ))}
          </div>
          <Sfx at={eventAt} name="pop" volume={0.6} />
          <Sfx at={eventAt + 8} name="success" volume={0.3} />
        </div>
      }
    />
  );
};

const BACKEND_CODE = `
const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, {
  camelCaseToKebabCase: false,
});
const { data } = await api.user.byId.$query.setPayload({ id: 1 }).send();
`;

const Backends: React.FC = () => (
  <Stack
    top={86}
    gap={50}
    copy={
      <>
        <Eyebrow>Typed clients from your backend</Eyebrow>
        <Title size={86} align="center" delay={4}>
          No schema. No codegen.
        </Title>
      </>
    }
    visual={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
        <LogoRow
          at={beat(0.5)}
          step={15}
          tile={128}
          logos={[
            { name: "trpc", label: "tRPC" },
            { name: "orpc", label: "oRPC" },
            { name: "hono", label: "Hono" },
            { name: "elysia", label: "Elysia" },
          ]}
        />
        <CodeWindow
          file="api.ts"
          code={BACKEND_CODE}
          fontSize={24}
          width={1260}
          delay={beat(2.5)}
          marks={[{ lines: [1, 1], from: beat(4), until: beat(6) }]}
          completes={[
            {
              line: 4,
              after: "api.user.",
              from: beat(6.5),
              items: [
                { label: "byId", detail: "query" },
                { label: "create", detail: "mutation" },
              ],
            },
          ]}
        />
        <Sfx at={beat(6.5)} name="pop" volume={0.6} />
      </div>
    }
  />
);

const OPTIMISTIC = `
const toggleTodo = updateTodo.setOptimistic(({ params, payload }) => [
  optimistic(getTodos).patch(params.todoId, payload),
]);
`;

const Check: React.FC<{ on: boolean }> = ({ on }) => (
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
    }}
  >
    {on && <Icon name="check" size={20} width={3} />}
  </span>
);

const Optimistic: React.FC = () => {
  const frame = useCurrentFrame();
  const clickAt = beat(4);
  const settleAt = beat(7);
  return (
    <Split
      copyWidth={560}
      gap={70}
      visualScale={1.0}
      copy={
        <>
          <Eyebrow>Optimistic updates</Eyebrow>
          <Title size={100} delay={4}>
            Describe the change.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "flex-start" }}>
          <CodeWindow file="todos.ts" code={OPTIMISTIC} fontSize={22} width={1040} delay={beat(0.1)} marks={[{ lines: [2, 2], from: beat(2.5) }]} />
          <div style={rise(frame, beat(1.5))}>
            <Panel
              width={640}
              title="Todos"
              badge={frame >= settleAt ? <Chip tone="green" size={17}>refetched</Chip> : frame >= clickAt ? <Chip tone="gold" size={17}>optimistic</Chip> : undefined}
            >
              <Row icon={<Check on={frame >= clickAt} />} label="Write the release post" flashAt={clickAt} />
              <Row icon={<Check on />} label="Tag v10" />
            </Panel>
          </div>
          <Sfx at={clickAt} name="pop" volume={0.7} />
          <Sfx at={settleAt} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

const Reconnect: React.FC = () => {
  const frame = useCurrentFrame();
  const lostAt = beat(2);
  const attempts = [beat(3.5), beat(5), beat(7.5)];
  const backAt = attempts[2] + 12;
  const W = 1400;
  const x = (f: number) => interpolate(f, [beat(0.5), beat(10)], [0, W], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const head = x(frame);
  const status = frame >= backAt ? "connected" : frame >= lostAt ? "reconnecting" : "connected";
  return (
    <Stack
      top={120}
      gap={100}
      copy={
        <>
          <Eyebrow>One reconnection engine</Eyebrow>
          <Title size={110} align="center" delay={4}>
            Sockets that recover.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 90, marginTop: 70, scale: "1.18" }}>
          <div style={{ position: "relative", width: W, height: 90 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 44, height: 2, background: "rgba(255,255,255,0.07)" }} />
            {/* The live connection: gold while up, broken and red while down */}
            <div style={{ position: "absolute", left: 0, top: 43, height: 4, width: Math.min(head, x(lostAt)), background: color.bolt, boxShadow: "0 0 14px rgba(251,198,70,0.8)", borderRadius: 4 }} />
            {frame >= lostAt && (
              <div
                style={{
                  position: "absolute",
                  left: x(lostAt),
                  top: 44,
                  height: 2,
                  width: Math.max(0, Math.min(head, x(backAt)) - x(lostAt)),
                  background: `linear-gradient(to right, ${color.red}, rgba(244,63,94,0.25))`,
                  boxShadow: "0 0 12px rgba(244,63,94,0.45)",
                  opacity: 0.7,
                }}
              />
            )}
            {frame >= backAt && (
              <div style={{ position: "absolute", left: x(backAt), top: 43, height: 4, width: Math.max(0, head - x(backAt)), background: color.green, boxShadow: "0 0 14px rgba(52,211,153,0.8)", borderRadius: 4 }} />
            )}
            {attempts.map((a, i) => {
              const s = pop(frame, a, 12);
              const ok = i === attempts.length - 1;
              return (
                <div key={a} style={{ position: "absolute", left: x(a) - 70, top: 0, width: 140, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, s) }}>
                  <div style={{ marginTop: 32, width: 26, height: 26, borderRadius: 99, background: ok ? color.green : color.zinc700, boxShadow: ok ? `0 0 20px ${color.green}` : `inset 0 0 0 2px ${color.zinc500}`, transform: `scale(${s})` }} />
                  <div style={{ marginTop: 14, fontFamily: mono, fontSize: 21, color: ok ? color.green : color.zinc400 }}>attempt {i + 1}</div>
                  <Sfx at={a} name={ok ? "success" : "tick"} volume={ok ? 0.35 : 0.5} />
                </div>
              );
            })}
            {frame >= lostAt && (
              <div style={{ position: "absolute", left: x(lostAt) - 80, top: -40, width: 160, textAlign: "center", ...rise(frame, lostAt, 10) }}>
                <Chip tone="red" size={18}>
                  connection lost
                </Chip>
              </div>
            )}
            <Sfx at={lostAt} name="glitch" volume={0.5} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, ...rise(frame, beat(1)) }}>
            <StatusDot tone={status === "connected" ? "green" : "gold"} />
            <span style={{ fontFamily: mono, fontSize: 26, color: status === "connected" ? color.green : color.bolt }}>{status}</span>
            <span style={{ width: 40 }} />
            {[
              ["sockets", "WebSocket"],
              ["sse", "SSE"],
              ["firebase", "Firebase"],
              ["graphql", "graphql-ws"],
              ["trpc", "tRPC"],
              ["orpc", "oRPC"],
            ].map(([logo, a], i) => (
              <span key={a} style={{ transform: `scale(${pop(frame, beat(9) + i * 5)})`, display: "inline-block" }}>
                <LogoChip logo={logo} size={20}>
                  {a}
                </LogoChip>
              </span>
            ))}
          </div>
        </div>
      }
    />
  );
};

const GQL = `
const getUser = client.createRequest()({ endpoint: GetUserDocument });
`;

const FIREBASE = `
getTeas.setQueryParams((c) => c.where("yaer", ">=", "2020"));
`;

const Typed: React.FC = () => (
  <Split
    copyWidth={540}
    gap={60}
    visualScale={1.08}
    copy={
      <>
        <Eyebrow>No generics</Eyebrow>
        <Title size={110} delay={4}>
          Typed end to end.
        </Title>
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          <LogoChip logo="graphql" size={24}>
            GraphQL
          </LogoChip>
          <LogoChip logo="firebase" size={24}>
            Firebase
          </LogoChip>
        </div>
      </>
    }
    visual={
      <div style={{ display: "flex", flexDirection: "column", gap: 46 }}>
        <CodeWindow
          file="users.ts"
          code={GQL}
          fontSize={22}
          width={1000}
          delay={beat(0.1)}
          hovers={[{ line: 1, match: "GetUserDocument", from: beat(2), until: beat(5.5), content: "TypedDocumentNode<GetUserQuery, GetUserQueryVariables>" }]}
        />
        <CodeWindow
          file="teas.ts"
          code={FIREBASE}
          fontSize={22}
          width={1000}
          delay={beat(1)}
          marks={[{ lines: [1, 1], from: beat(6), tone: "red" }]}
          squiggles={[{ line: 1, match: '"yaer"', from: beat(6), message: "✗ unknown field, and year is a number" }]}
        />
        <Sfx at={beat(2)} name="pop" volume={0.5} />
        <Sfx at={beat(6)} name="error" volume={0.55} />
      </div>
    }
  />
);

/*
 * Numbers measured in the repository at release, not estimated:
 * - test cases in the library packages (HyperFlow and the internal testing package excluded), counted from it()/test()
 *   calls: 1,627 at v9.0.0 and 6,754 at release, so 5,000+ were added in the v10 cycle;
 * - line coverage from `vitest run --coverage`: core 99.51%, React 99.28%, DB 100%.
 */
const Hardened: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stack
      top={110}
      gap={40}
      copy={
        <>
          <Eyebrow>Tested since v9</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26, ...rise(frame, 4) }}>
            <Counter to={5000} at={beat(0)} duration={beat(2) - beat(0)} suffix="+" size={150} />
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", color: color.zinc200 }}>new tests</span>
          </div>
          <Sfx at={beat(2)} name="impact" volume={0.35} />
        </>
      }
      visual={
        <ChartCard at={beat(1)} title="test cases per release" padding={36}>
          <Spark points={TEST_GROWTH} at={beat(2)} duration={beat(8) - beat(2)} width={1380} height={420} />
        </ChartCard>
      }
    />
  );
};

export const hyperFetch10Video: VideoDefinition = {
  id: "HyperFetch10",
  post: "hyper-fetch-10-0",
  pattern: "flickering",
  mask: "full",
  scenes: [
    { id: "hook", node: <Hook words={["tRPC.", "Hono.", "GraphQL.", "Firebase."]} line="One typed client for all of them." gold={["typed"]} /> },
    { id: "intro", node: <Intro title="HyperFetch 10" description="Your backend, typed. Every transport, realtime." pill="Just shipped" label="Release" gold={["10"]} titleSize={210} logos={[
          { logo: "db", label: "DB" },
          { logo: "trpc", label: "tRPC" },
          { logo: "orpc", label: "oRPC" },
          { logo: "hono", label: "Hono" },
          { logo: "elysia", label: "Elysia" },
          { logo: "graphql", label: "GraphQL" },
          { logo: "firebase", label: "Firebase" },
          { logo: "react", label: "React" },
        ]} /> },
    { id: "highlights", node: <Highlights /> },
    { id: "db", node: <Db /> },
    { id: "backends", node: <Backends /> },
    { id: "optimistic", node: <Optimistic /> },
    { id: "sockets", node: <Reconnect /> },
    { id: "typed", node: <Typed /> },
    { id: "hardened", node: <Hardened /> },
    { id: "slam-client", node: <Slam first="One client." second="Every backend." /> },
    { id: "slam-last", node: <Slam first="Built" second="to last." /> },
    {
      id: "outro",
      node: <Outro install="npm install @hyper-fetch/core@10 @hyper-fetch/react@10" post="hyper-fetch-10-0" logos={[{ logo: "hyper-fetch", label: "Core" }, { logo: "react", label: "React" }]} />,
    },
  ],
};

