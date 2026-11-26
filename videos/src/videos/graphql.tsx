import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, pop, progress, rise, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Split, Stack } from "../brand/Timeline";
import { body, color, display, mono, syntax } from "../brand/tokens";
import { Card, Chip, Eyebrow, Logo, type LogoItem, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";

import { Outro } from "../scenes/Outro";
import { AppWindow, Skeleton } from "../visuals/app";
import { Beam, Mono, Row, TypingSfx } from "../visuals/common";
import { Icon, IconTile } from "../visuals/extra";

/*
 * GraphQL in HyperFetch 10: typed documents, automatic persisted queries, the error policy, refetching every
 * variant of an operation and subscriptions over graphql-ws. Every hit sits on the beat grid (see motion.beat).
 */

/* ------------------------------------------------------------------------------------------ typed documents */

const REQUESTS = `
import { GetUserDocument } from "./gql/graphql"; // generated

export const getUser = client.createRequest()({ endpoint: GetUserDocument });

const { data } = await getUser.send({ payload: { id: "1" } });
`;

const TypedDocuments: React.FC = () => {
  const frame = useCurrentFrame();
  const typeFrom = beat(0.5);
  const cps = 200;
  const sendAt = beat(9.5);
  const dataAt = beat(11);
  return (
    <Stack
      top={200}
      gap={100}
      visualScale={1}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Logo name="graphql" size={34} />
            <Eyebrow>Typed documents</Eyebrow>
          </div>
          <Title size={104} align="center" delay={4}>
            The document is the type.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1600, height: 420 }}>
          <div style={{ position: "absolute", left: 0, top: 40 }}>
            <CodeWindow
              file="requests.ts"
              code={REQUESTS}
              fontSize={21}
              width={1060}
              delay={4}
              typeFrom={typeFrom}
              cps={cps}
              marks={[
                { lines: [3, 3], from: beat(5), until: beat(9) },
                { lines: [5, 5], from: beat(9) },
              ]}
              hovers={[
                { line: 3, match: "GetUserDocument", from: beat(5.5), until: beat(8.8), content: "TypedDocumentNode<GetUserQuery, GetUserQueryVariables>" },
                { line: 5, match: "payload", from: beat(12), until: beat(15), content: "(property) payload: GetUserQueryVariables" },
              ]}
            />
          </div>
          <svg width={100} height={420} style={{ position: "absolute", left: 1060, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={255} x2={100} y2={200} at={sendAt} />
          </svg>
          <div style={{ position: "absolute", left: 1160, top: 0 }}>
            <AppWindow address="/users/1" footer="types" status="from the document" statusAt={dataAt + 24} statusTone="green" width={440} minHeight={230} at={beat(2)} order={2}>
              {frame < dataAt ? (
                <Skeleton rows={3} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["user.id", '"1"'],
                    ["user.name", '"Ann"'],
                    ["user.email", '"ann@…"'],
                  ].map(([k, v], i) => (
                    <Row key={k} mono flashAt={dataAt + i * 4} label={<span style={{ color: syntax.variable }}>{k}</span>} value={<Mono size={22} color={syntax.string}>{v}</Mono>} />
                  ))}
                </div>
              )}
            </AppWindow>
          </div>
          <TypingSfx from={typeFrom} chars={REQUESTS.trim().length} cps={cps} />
          <Sfx at={beat(5.5)} name="pop" volume={0.55} />
          <Sfx at={sendAt} name="swish" volume={0.45} />
          <Sfx at={dataAt} name="pop" volume={0.6} />
          <Sfx at={dataAt + 24} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ persisted queries */

const PERSISTED = `
const getUser = client.createRequest()({
  endpoint: GetUserDocument,
  method: GraphqlMethod.GET,
  options: { persistedQueries: true },
});
`;

const QUERY_TEXT = ["query GetUser($id: ID!) {", "  user(id: $id) {", "    id", "    name", "  }", "}"];
const HASH = "4f2a7c91d03be65f18a2c4e7b90d13f5a6e8c2b47d91f0e3a5c8b6d2e19c7a04";

/* The hash types itself in out of scrambled hex, so it reads as computed, not pasted */
const Scramble: React.FC<{ text: string; at: number; duration: number }> = ({ text, at, duration }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, duration);
  const fixed = Math.floor(p * text.length);
  const hex = "0123456789abcdef";
  const shown = text
    .split("")
    .map((ch, i) => (i < fixed ? ch : hex[(i * 7 + frame * 3) % 16]))
    .join("");
  return <>{shown}</>;
};

const Persisted: React.FC = () => {
  const frame = useCurrentFrame();
  const collapseAt = beat(3);
  const getAt = beat(5.5);
  const cdnAt = beat(7.5);
  const collapse = progress(frame, collapseAt, sec(0.4));
  const after = progress(frame, collapseAt + 10, sec(0.4));
  const short = `${HASH.slice(0, 10)}…${HASH.slice(-6)}`;
  return (
    <Stack
      top={84}
      gap={40}
      visualScale={1}
      copy={
        <>
          <Eyebrow>Persisted queries</Eyebrow>
          <Title size={92} align="center" delay={4}>
            Send a hash, not the query.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <CodeWindow file="users.ts" code={PERSISTED} fontSize={23} width={980} delay={beat(0.1)} marks={[{ lines: [4, 4], from: beat(1.5) }, { lines: [3, 3], from: getAt - 10 }]} />
          <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
            <div style={rise(frame, beat(1))}>
              <Card radius={24} style={{ width: 720, minHeight: 236, padding: "24px 30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <span style={{ fontFamily: body, fontWeight: 600, fontSize: 24, color: color.zinc200 }}>Request</span>
                  <span style={{ marginLeft: "auto" }}>
                    <Chip tone={frame >= collapseAt ? "gold" : "zinc"} size={18}>
                      {frame >= collapseAt ? "sha256 hash" : "full query"}
                    </Chip>
                  </span>
                </div>
                <div style={{ position: "relative", fontFamily: mono, fontSize: 23, lineHeight: 1.55, minHeight: QUERY_TEXT.length * 23 * 1.55 }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 1 - collapse, transform: `scaleY(${1 - collapse * 0.6})`, transformOrigin: "top", filter: collapse > 0 ? `blur(${collapse * 6}px)` : undefined }}>
                    {QUERY_TEXT.map((l) => (
                      <div key={l} style={{ color: l.startsWith("query") ? syntax.keyword : syntax.variable, whiteSpace: "pre" }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <div style={{ opacity: after, transform: `translateY(${(1 - after) * 12}px)` }}>
                    <div style={{ whiteSpace: "pre", color: syntax.variable }}>
                      operationName: <span style={{ color: syntax.string }}>"GetUser"</span>
                    </div>
                    <div style={{ whiteSpace: "pre", color: syntax.variable }}>extensions.persistedQuery:</div>
                    <div style={{ whiteSpace: "pre", color: syntax.variable }}>
                      {"  "}sha256Hash: <span style={{ color: color.bolt }}>"<Scramble text={short} at={collapseAt + 10} duration={sec(0.8)} />"</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <svg width={120} height={40} style={{ overflow: "visible", opacity: progress(frame, getAt - 10, 10) }}>
              <Beam x1={0} y1={20} x2={120} y2={20} at={getAt} />
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, ...rise(frame, getAt, 20) }}>
              <Card radius={22} lit={false} style={{ width: 640, padding: "20px 26px", whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Chip tone="blue" size={20}>
                    GET
                  </Chip>
                  <Mono size={23} color={color.zinc200}>
                    /graphql?operationName=GetUser&…
                  </Mono>
                </div>
              </Card>
              <div style={{ display: "flex", alignItems: "center", gap: 18, ...rise(frame, cdnAt, 16) }}>
                <IconTile size={62}>
                  <Icon name="layers" size={32} />
                </IconTile>
                <span style={{ fontFamily: display, fontWeight: 800, fontSize: 34, letterSpacing: "-0.02em", color: color.zinc100 }}>CDN</span>
                {frame >= cdnAt + 12 && (
                  <span style={{ display: "inline-block", transform: `scale(${pop(frame, cdnAt + 12)})` }}>
                    <Chip tone="green" size={21}>
                      cache hit
                    </Chip>
                  </span>
                )}
              </div>
            </div>
          </div>
          <Sfx at={collapseAt} name="swish" volume={0.55} />
          <Sfx at={collapseAt + 10} name="glitch" volume={0.35} />
          <Sfx at={getAt} name="whoosh" volume={0.35} />
          <Sfx at={cdnAt} name="pop" volume={0.55} />
          <Sfx at={cdnAt + 12} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ error policy */

const DASHBOARD = `
const getDashboard = client.createRequest()({
  endpoint: GetDashboardDocument,
  options: { errorPolicy: "all" },
});
`;

const Widget: React.FC<{ name: string; value: string; broken?: boolean; policyAll: boolean; flashAt: number }> = ({ name, value, broken, policyAll, flashAt }) => {
  const frame = useCurrentFrame();
  const failed = !policyAll;
  const lit = Math.max(0, 1 - Math.max(0, frame - flashAt) / 30) * (frame >= flashAt ? 1 : 0);
  const tone = failed ? "rgba(244,63,94,0.35)" : broken ? "rgba(251,198,70,0.3)" : `rgba(52,211,153,${0.15 + lit * 0.6})`;
  return (
    <Card radius={22} lit={false} style={{ flex: 1, height: 170, padding: "20px 24px", boxShadow: `inset 0 0 0 1.5px ${tone}, 0 0 ${lit * 40}px rgba(52,211,153,${lit * 0.3})` }}>
      <div style={{ fontFamily: body, fontSize: 21, color: color.zinc500 }}>{name}</div>
      {failed ? (
        <div style={{ marginTop: 14 }}>
          <Mono size={24} color="#fb7185">
            data: null
          </Mono>
        </div>
      ) : broken ? (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: 32, color: color.zinc500 }}>unavailable</span>
          <Mono size={19} color={color.bolt}>
            extra.errors[0].path
          </Mono>
        </div>
      ) : (
        <div style={{ marginTop: 10, fontFamily: display, fontWeight: 900, fontSize: 52, letterSpacing: "-0.03em", color: color.zinc50 }}>{value}</div>
      )}
    </Card>
  );
};

const ErrorPolicy: React.FC = () => {
  const frame = useCurrentFrame();
  const flipAt = beat(5);
  const policyAll = frame >= flipAt;
  const knob = progress(frame, flipAt, sec(0.3));
  return (
    <Split
      copyWidth={560}
      gap={64}
      visualScale={1}
      copy={
        <>
          <Eyebrow>Error policy</Eyebrow>
          <Title size={96} delay={4}>
            Partial data, still a success.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", gap: 34, width: 1000 }}>
          <CodeWindow file="dashboard.ts" code={DASHBOARD} fontSize={24} width={1000} delay={beat(0.1)} marks={[{ lines: [3, 3], from: flipAt - 6 }]} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, ...rise(frame, beat(0.8)) }}>
            <Mono size={24} color={color.zinc400}>
              errorPolicy
            </Mono>
            <div style={{ position: "relative", display: "flex", padding: 6, borderRadius: 16, background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  bottom: 6,
                  left: 6 + knob * 170,
                  width: 170,
                  borderRadius: 12,
                  background: policyAll ? "rgba(251,198,70,0.16)" : "rgba(255,255,255,0.08)",
                  boxShadow: policyAll ? "inset 0 0 0 1px rgba(251,198,70,0.4)" : "inset 0 0 0 1px rgba(255,255,255,0.15)",
                }}
              />
              {['"none"', '"all"'].map((p, i) => (
                <span key={p} style={{ position: "relative", width: 170, textAlign: "center", padding: "10px 0", fontFamily: mono, fontSize: 23, color: (i === 1) === policyAll ? color.zinc50 : color.zinc500 }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <AppWindow address="/dashboard" footer="response" status="partial success" statusAt={flipAt + 22} statusTone="green" width={1000} minHeight={170} at={beat(1)} order={3}>
            <div style={{ display: "flex", gap: 20 }}>
              <Widget name="Active users" value="1,204" policyAll={policyAll} flashAt={flipAt + 6} />
              <Widget name="Revenue" value="$8.2k" policyAll={policyAll} flashAt={flipAt + 12} />
              <Widget name="Churn" value="" broken policyAll={policyAll} flashAt={flipAt + 18} />
            </div>
          </AppWindow>
          <Sfx at={beat(1.2)} name="error" volume={0.4} />
          <Sfx at={flipAt} name="pop" volume={0.6} />
          <Sfx at={flipAt + 6} name="tick" volume={0.45} />
          <Sfx at={flipAt + 12} name="tick" volume={0.45} />
          <Sfx at={flipAt + 18} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ refetch */

const REFETCH = `
if (success) {
  client.cache.invalidate(matchGqlOperation(GetUserDocument));
}
`;

const CACHE = [
  { op: "GetUser", vars: 'id: "1"', match: true },
  { op: "GetUser", vars: 'id: "2"', match: true },
  { op: "GetPosts", vars: "", match: false },
  { op: "GetUser", vars: 'id: "7"', match: true },
  { op: "GetTeam", vars: 'id: "3"', match: false },
];

const Refetch: React.FC = () => {
  const frame = useCurrentFrame();
  const sendAt = beat(2.5);
  const sweepAt = beat(5);
  const rowAt = (i: number) => sweepAt + 6 + i * 7;
  const sweep = progress(frame, sweepAt, sec(0.7));
  return (
    <Stack
      top={170}
      gap={80}
      visualScale={1}
      copy={
        <>
          <Eyebrow>Operation refetch</Eyebrow>
          <Title size={100} align="center" delay={4}>
            Every cached GetUser, at once.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1600, height: 560 }}>
          <div style={{ position: "absolute", left: 0, top: 170 }}>
            <CodeWindow
              file="update-user.ts"
              code={REFETCH}
              fontSize={24}
              width={990}
              delay={beat(0.1)}
              marks={[
                { lines: [1, 1], from: sendAt, until: sweepAt - 8 },
                { lines: [2, 2], from: sweepAt - 8 },
              ]}
            />
          </div>
          <svg width={100} height={560} style={{ position: "absolute", left: 990, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={262} x2={100} y2={262} at={sweepAt - 14} />
          </svg>
          <div style={{ position: "absolute", left: 1090, top: 0 }}>
            <AppWindow address="client.cache" footer="matchGqlOperation" status="3 invalidated" statusAt={rowAt(3) + 10} statusTone="gold" width={510} minHeight={370} at={beat(0.4)} order={2}>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
                {CACHE.map((c, i) => {
                  const hit = c.match && frame >= rowAt(i);
                  return (
                    <Row
                      key={`${c.op}-${c.vars}`}
                      mono
                      flashAt={c.match ? rowAt(i) : undefined}
                      state={hit ? "pending" : "idle"}
                      label={
                        <span>
                          <span style={{ color: c.match ? syntax.fn : color.zinc300 }}>{c.op}</span>
                          {c.vars && <span style={{ color: color.zinc500 }}> · {c.vars}</span>}
                        </span>
                      }
                      value={hit ? <Chip tone="gold" size={16}>stale</Chip> : <Chip size={16}>cached</Chip>}
                    />
                  );
                })}
                {frame >= sweepAt && sweep < 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: -10,
                      right: -10,
                      top: interpolate(sweep, [0, 1], [0, 360]),
                      height: 4,
                      borderRadius: 4,
                      background: color.bolt,
                      boxShadow: "0 0 24px 4px rgba(251,198,70,0.7)",
                    }}
                  />
                )}
              </div>
            </AppWindow>
          </div>
          {CACHE.map((c, i) => (c.match ? <Sfx key={i} at={rowAt(i)} name="tick" volume={0.5} /> : null))}
          <Sfx at={sendAt} name="pop" volume={0.55} />
          <Sfx at={sweepAt - 14} name="swish" volume={0.5} />
          <Sfx at={rowAt(3) + 10} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ subscriptions */

const SUBSCRIPTIONS = `
const socket = new Socket({ url, adapter: GraphqlWsAdapter() });

export const onMessage = socket.createListener()({
  topic: "OnMessage",
  options: { document: OnMessageDocument },
});
`;

const Subscriptions: React.FC = () => {
  const messages = [
    { at: beat(4), who: "Ann", text: "v10 is out" },
    { at: beat(5.5), who: "Bob", text: "typed data" },
    { at: beat(9.5), who: "Ann", text: "still here" },
  ];
  const lostAt = beat(7);
  const backAt = beat(8.5);
  return (
    <Stack
      top={180}
      gap={90}
      visualScale={1}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Logo name="graphql" size={34} />
            <Eyebrow>graphql-ws</Eyebrow>
          </div>
          <Title size={104} align="center" delay={4}>
            Subscriptions survive reconnects.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1600, height: 520 }}>
          <div style={{ position: "absolute", left: 0, top: 90 }}>
            <CodeWindow
              file="subscriptions.ts"
              code={SUBSCRIPTIONS}
              fontSize={22}
              width={980}
              delay={beat(0.1)}
              marks={[
                { lines: [1, 1], from: beat(1.5), until: beat(3) },
                { lines: [5, 5], from: beat(3), until: lostAt },
                { lines: [1, 1], from: lostAt },
              ]}
            />
          </div>
          <svg width={100} height={520} style={{ position: "absolute", left: 980, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={250} x2={100} y2={250} at={beat(3) + 10} />
          </svg>
          <div style={{ position: "absolute", left: 1080, top: 0 }}>
            <AppWindow address="# general" footer="subscription" status="resubscribed" statusAt={backAt} statusTone="green" width={520} minHeight={330} at={beat(0.5)} order={2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.slice(0, 2).map((m) => (
                  <Row key={m.at} enterAt={m.at} flashAt={m.at} label={<span style={{ color: color.zinc100 }}>{m.text}</span>} value={<Mono size={21} color={color.zinc500}>{m.who}</Mono>} />
                ))}
                <Row enterAt={lostAt} flashAt={lostAt} state="error" label={<span style={{ color: "#fb7185" }}>connection lost</span>} />
                <Row enterAt={messages[2].at} flashAt={messages[2].at} label={<span style={{ color: color.zinc100 }}>{messages[2].text}</span>} value={<Mono size={21} color={color.zinc500}>{messages[2].who}</Mono>} />
              </div>
            </AppWindow>
          </div>
          <Sfx at={beat(3) + 10} name="swish" volume={0.45} />
          {messages.map((m) => (
            <Sfx key={m.at} at={m.at} name="pop" volume={0.55} />
          ))}
          <Sfx at={lostAt} name="glitch" volume={0.5} />
          <Sfx at={backAt} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

const LOGOS: LogoItem[] = [
  { logo: "graphql", label: "GraphQL" },
  { logo: "sockets", label: "graphql-ws" },
  { logo: "hyper-fetch", label: "@hyper-fetch/graphql" },
];

export const graphqlVideo: VideoDefinition = {
  id: "GraphQL",
  post: "hyper-fetch-10-graphql",
  pattern: "dots",
  mask: "right",
  scenes: [
    { id: "hook", node: <Hook words={["Fields.", "Variables.", "Generics.", "Types."]} line="Let the query do the typing." gold={["query"]} /> },
    { id: "intro", node: <Intro title="GraphQL in HyperFetch 10" description="Typed documents, persisted queries and subscriptions." gold={["GraphQL"]} titleSize={124} logos={LOGOS} /> },
    { id: "typed-documents", node: <TypedDocuments /> },
    { id: "persisted", node: <Persisted /> },
    { id: "error-policy", node: <ErrorPolicy /> },
    { id: "refetch", node: <Refetch /> },
    { id: "subscriptions", node: <Subscriptions /> },
    { id: "slam-generics", node: <Slam first="Zero" second="generics." /> },
    { id: "slam-live", node: <Slam first="Always" second="live." /> },
    {
      id: "outro",
      node: <Outro install="npm install @hyper-fetch/core @hyper-fetch/sockets @hyper-fetch/graphql graphql" post="hyper-fetch-10-graphql" logos={LOGOS} />,
    },
  ],
};
