import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, deal } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Stack } from "../brand/Timeline";
import { body, color } from "../brand/tokens";
import { Card, Chip, Eyebrow, Logo, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";

import { Outro } from "../scenes/Outro";
import { AppWindow, Caption } from "../visuals/app";
import { Beam, Mono, Row, TypingSfx } from "../visuals/common";

/*
 * Typed clients from your backend. One eyebrow, one short title and one visual per scene; every backend named on
 * screen carries its logo. Every hit sits on the beat grid (see motion.beat).
 */

const Dot: React.FC<{ tone: "green" | "gold" | "red" }> = ({ tone }) => {
  const c = tone === "green" ? color.green : tone === "gold" ? color.bolt : color.red;
  return <span style={{ width: 12, height: 12, borderRadius: 99, background: c, boxShadow: `0 0 10px ${c}`, display: "inline-block" }} />;
};

/* An eyebrow with the logo of the package it names */
const LogoEyebrow: React.FC<{ logo: string; children: React.ReactNode; center?: boolean }> = ({ logo, children, center }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: center ? "center" : "flex-start" }}>
    <Logo name={logo} size={36} />
    <Eyebrow>{children}</Eyebrow>
  </div>
);

/* ----------------------------------------------------------------------------------------------- four */

const FOUR = [
  { logo: "trpc", name: "tRPC", code: "createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });" },
  { logo: "orpc", name: "oRPC", code: "createSdk<typeof client, OrpcSchema<typeof router>>(client, { camelCaseToKebabCase: false });" },
  { logo: "hono", name: "Hono", code: "createSdk<typeof client, HonoSchema<typeof app>>(client);" },
  { logo: "elysia", name: "Elysia", code: "createSdk<typeof client, ElysiaSchema<typeof app>>(client);" },
];

const FourRow: React.FC<{ at: number; order: number; logo: string; name: string; code: string }> = ({ at, order, logo, name, code }) => {
  const frame = useCurrentFrame();
  const cps = 90;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30, ...deal(frame, at, order, 120) }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 120 }}>
        <Card radius={24} style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Logo name={logo} size={50} />
        </Card>
        <span style={{ fontFamily: body, fontWeight: 600, fontSize: 21, color: color.zinc300 }}>{name}</span>
      </div>
      <CodeWindow code={code} lineNumbers={false} glow={false} fontSize={23} width={1440} typeFrom={at + 6} cps={cps} />
      <TypingSfx from={at + 6} chars={code.length} cps={cps} every={6} volume={0.16} />
      <Sfx at={at} name="pop" volume={0.45} />
    </div>
  );
};

const Four: React.FC = () => (
  <Stack
    top={90}
    gap={56}
    copy={
      <>
        <Eyebrow>One createSdk</Eyebrow>
        <Title size={96} align="center" delay={4}>
          Your server has the types.
        </Title>
      </>
    }
    visual={
      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {FOUR.map((f, i) => (
          <FourRow key={f.name} at={beat(1 + i * 2)} order={i} {...f} />
        ))}
      </div>
    }
  />
);

/* ----------------------------------------------------------------------------------------------- tRPC */

const SERVER = `
byId: t.procedure
  .input((value) => value as { id: number })
  .query(({ input }) => getUser(input.id)),

export type AppRouter = typeof appRouter;
`;

const CLIENT = `
const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, {
  camelCaseToKebabCase: false,
});

const { data } = await api.user.byId.$query.setPayload({ id: 1 }).send();
`;

const Trpc: React.FC = () => {
  const flowAt = beat(3);
  const clientAt = beat(3.5);
  const typeAt = beat(6);
  const cps = 40;
  const prefix = CLIENT.trim().split("\n").slice(0, 4).join("\n").length + 1;
  const popupAt = typeAt + Math.round(("const { data } = await api.user.".length / cps) * 60);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 100, display: "flex", flexDirection: "column", gap: 16 }}>
        <LogoEyebrow logo="trpc">tRPC</LogoEyebrow>
        <Title size={96} delay={4}>
          The router is the schema.
        </Title>
      </div>
      {/* The two windows as one group, scaled up to fill the frame */}
      <div style={{ position: "absolute", inset: 0, scale: "1.07", transformOrigin: "110px 330px" }}>
      <div style={{ position: "absolute", left: 120, top: 340 }}>
        <CodeWindow file="server.ts" code={SERVER} fontSize={22} width={720} delay={beat(0)} marks={[{ lines: [5, 5], from: flowAt - 12 }]} />
      </div>
      <div style={{ position: "absolute", left: 700, top: 680 }}>
        <CodeWindow
          file="api.ts"
          code={CLIENT}
          fontSize={20}
          width={960}
          delay={clientAt - 10}
          typeFrom={typeAt}
          typeFromChar={prefix}
          cps={cps}
          marks={[{ lines: [1, 1], from: clientAt }]}
          completes={[
            {
              line: 5,
              after: "api.user.",
              from: popupAt,
              until: popupAt + 50,
              items: [
                { label: "byId", detail: "query" },
                { label: "create", detail: "mutation" },
              ],
            },
          ]}
        />
      </div>
      {/*
        The cable runs straight down through the 60px gap, from the bottom edge of server.ts to the top edge of api.ts,
        where the two windows overlap horizontally. It is drawn after both windows so neither card hides its ends.
      */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        <Beam x1={780} y1={620} x2={780} y2={680} orient="vertical" at={flowAt} drawAt={flowAt - 20} />
      </svg>
      </div>
      <TypingSfx from={typeAt} chars={73} cps={cps} every={4} volume={0.18} />
      <Sfx at={flowAt} name="swish" volume={0.55} />
      <Sfx at={clientAt} name="pop" volume={0.55} />
      <Sfx at={popupAt} name="tick" volume={0.6} />
    </AbsoluteFill>
  );
};

/* A lit cable between two side-by-side elements, from y1 on the left edge to y2 on the right edge */
const Bridge: React.FC<{ width: number; y1: number; y2: number; at: number; drawAt?: number }> = ({ width, y1, y2, at, drawAt }) => (
  <div style={{ position: "relative", width, alignSelf: "stretch", flexShrink: 0 }}>
    <svg width={width} height={Math.max(y1, y2) + 20} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Beam x1={0} y1={y1} x2={width} y2={y2} at={at} drawAt={drawAt} />
    </svg>
  </div>
);

/* ----------------------------------------------------------------------------------------------- Elysia */

const ELYSIA = `
.get("/:userId", ({ params, status }) =>
  params.userId === "1"
    ? { id: "1", name: "Ann" }
    : status(404, { message: "Not found" }),
)
`;

const FRONT = `
const { data, error } = await sdk.users.$userId.$get
  .setParams({ userId: "1" })
  .send();
`;

const Elysia: React.FC = () => {
  const okAt = beat(3);
  const missAt = beat(6.5);
  return (
    <Stack
      top={90}
      gap={56}
      copy={
        <>
          <LogoEyebrow logo="elysia" center>
            Elysia
          </LogoEyebrow>
          <Title size={100} align="center" delay={4}>
            Errors typed per status.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Caption>Server</Caption>
              <CodeWindow
                file="app.ts"
                code={ELYSIA}
                fontSize={21}
                width={940}
                delay={beat(0)}
                marks={[
                  { lines: [3, 3], from: okAt - 10, until: missAt - 10, tone: "green" },
                  { lines: [4, 4], from: missAt - 10, tone: "red" },
                ]}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Caption>Client</Caption>
              <CodeWindow file="api.ts" code={FRONT} fontSize={21} width={940} delay={beat(1)} glow={false} />
            </div>
          </div>
          <Bridge width={100} y1={170} y2={150} at={okAt - 16} drawAt={beat(1)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <AppWindow address="GET /users/1" footer="data" status="200" statusAt={okAt + 16} statusTone="green" width={540} minHeight={140} at={beat(0.6)} order={2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Row mono label="id" enterAt={okAt} value={<Mono color={color.green}>"1"</Mono>} />
                <Row mono label="name" enterAt={okAt + 5} value={<Mono color={color.green}>"Ann"</Mono>} />
              </div>
            </AppWindow>
            <AppWindow address="GET /users/2" footer="error" status="404" statusAt={missAt + 16} statusTone="red" width={540} minHeight={64} at={beat(4)} order={3}>
              <Row mono label="message" enterAt={missAt} state="error" value={<Mono color="#fb7185">"Not found"</Mono>} />
            </AppWindow>
          </div>
          <Sfx at={okAt} name="pop" volume={0.55} />
          <Sfx at={missAt} name="error" volume={0.5} />
        </div>
      }
    />
  );
};

/* ----------------------------------------------------------------------------------------------- subscriptions */

const SOCKET = `
const socket = new Socket({
  url: "ws://localhost:3001",
  adapter: TrpcWebsocketAdapter(),
});
`;

const LISTEN = `
realtime.chat.onMessage.$listener
  .setPayload({ room: "general" })
  .listen(({ data, extra }) => console.log(data.text, extra.eventId));
`;

const MESSAGES = [
  { id: 1, who: "Ada", text: "Deploying v10", at: 1.5 },
  { id: 2, who: "Alan", text: "Tests green", at: 2.5 },
  { id: 3, who: "Grace", text: "Release tagged", at: 3.5 },
  { id: 4, who: "Linus", text: "Published to npm", at: 8 },
  { id: 5, who: "Ada", text: "Docs live", at: 9 },
];

const Subscriptions: React.FC = () => {
  const frame = useCurrentFrame();
  const lostAt = beat(4.5);
  const backAt = beat(6.5);
  const down = frame >= lostAt && frame < backAt;
  return (
    <Stack
      top={120}
      gap={70}
      copy={
        <>
          <LogoEyebrow logo="trpc" center>
            tRPC subscriptions
          </LogoEyebrow>
          <Title size={100} align="center" delay={4}>
            Resume after a reconnect.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <CodeWindow file="socket.ts" code={SOCKET} fontSize={21} width={960} delay={beat(0)} marks={[{ lines: [3, 3], from: beat(0.8) }]} />
            <CodeWindow file="chat.ts" code={LISTEN} fontSize={21} width={960} delay={beat(0.6)} marks={[{ lines: [3, 3], from: beat(1.2) }]} />
          </div>
          <Bridge width={100} y1={330} y2={200} at={beat(1.5) - 16} drawAt={beat(1)} />
          <AppWindow
            address="#general"
            footer="socket"
            status="lastEventId: 3"
            statusAt={backAt}
            statusTone="gold"
            width={580}
            minHeight={380}
            at={beat(0.4)}
            order={2}
            headerRight={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: down ? color.red : color.green }}>
                <Dot tone={down ? "red" : "green"} /> {down ? "reconnecting" : "live"}
              </span>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MESSAGES.map((m) => (
                <Row
                  key={m.id}
                  label={
                    <span>
                      <span style={{ color: color.zinc500, marginRight: 12 }}>{m.who}</span>
                      {m.text}
                    </span>
                  }
                  enterAt={beat(m.at)}
                  flashAt={beat(m.at)}
                  value={<Mono color={color.zinc500}>id {m.id}</Mono>}
                />
              ))}
            </div>
          </AppWindow>
          {MESSAGES.map((m) => (
            <Sfx key={m.id} at={beat(m.at)} name="pop" volume={0.45} />
          ))}
          <Sfx at={lostAt} name="glitch" volume={0.5} />
          <Sfx at={backAt} name="success" volume={0.38} />
        </div>
      }
    />
  );
};

/*
 * A dashboard that talks to two backends. Every hook's request is a regular Request, so all of them go through the
 * one HyperFetch client: cache, dedupe, retry, queue. When a second component asks for the same user, dedupe answers
 * it and nothing new goes to the server.
 */
const WIDGETS = [
  { label: "Profile", logo: "trpc", call: "user.byId", value: "Ada", server: 0 },
  { label: "Orders", logo: "hono", call: "GET /orders", value: "12 orders", server: 1 },
  { label: "Chat", logo: "trpc", call: "chat.onMessage", value: "live", server: 0 },
];
const STAGES = ["cache", "dedupe", "retry", "queue"];
const SERVERS = [
  { logo: "trpc", label: "tRPC server", y: 40 },
  { logo: "hono", label: "Hono server", y: 250 },
];

const DASH_CODE = `
useFetch(api.user.byId.$query.setPayload({ id: 1 }));
useSubmit(sdk.users.$post.setQueued(true));
`;

const SameRequest: React.FC = () => {
  const frame = useCurrentFrame();
  const sendAt = (i: number) => beat(1.5 + i * 1.5);
  const dupAt = beat(7);
  const rowY = (i: number) => 106 + i * 74;
  const client = { x: 680, y: 40, w: 400, h: 360 };
  /* A stage lights while a request passes it: cache and queue for every send, dedupe for the duplicate */
  const lit = (k: number) => {
    const hits = [...WIDGETS.map((_, i) => sendAt(i) + 18), dupAt + 18];
    return Math.max(0, ...hits.map((h, idx) => {
      const isDup = idx === WIDGETS.length;
      if (isDup ? k !== 1 : k === 1) return 0;
      const d = frame - h;
      return d >= 0 && d < 40 ? 1 - d / 40 : 0;
    }));
  };
  return (
    <Stack
      top={110}
      gap={50}
      visualScale={0.98}
      copy={
        <>
          <Eyebrow>Same request type</Eyebrow>
          <Title size={100} align="center" delay={4}>
            One client, every backend.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1720, height: 640 }}>
          <svg width={1720} height={640} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
            {WIDGETS.map((w, i) => (
              <React.Fragment key={w.label}>
                <Beam x1={560} y1={rowY(i)} x2={client.x} y2={client.y + 160 + (i - 1) * 40} at={sendAt(i)} drawAt={beat(0.8)} orient="horizontal" />
                <Beam x1={client.x + client.w} y1={client.y + 160 + (i - 1) * 40} x2={1460} y2={SERVERS[w.server].y + 60} at={sendAt(i) + 30} drawAt={beat(0.8)} orient="horizontal" />
              </React.Fragment>
            ))}
            <Beam x1={560} y1={rowY(3)} x2={client.x} y2={client.y + 240} at={dupAt} drawAt={dupAt - 20} orient="horizontal" />
          </svg>

          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <AppWindow address="/dashboard" footer="4 hooks" status="3 requests" statusAt={dupAt + 30} statusTone="gold" width={560} minHeight={0} at={beat(0.3)} order={1}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {WIDGETS.map((w, i) => (
                  <Row
                    key={w.label}
                    icon={<Logo name={w.logo} size={26} />}
                    label={w.label}
                    flashAt={sendAt(i) + 50}
                    value={frame >= sendAt(i) + 50 ? <Mono color={color.zinc100}>{w.value}</Mono> : <Mono color={color.zinc600}>…</Mono>}
                  />
                ))}
                <Row icon={<Logo name="trpc" size={26} />} label="Header avatar" enterAt={dupAt - 30} flashAt={dupAt + 24} value={frame >= dupAt + 24 ? <Chip tone="gold" size={17}>shared</Chip> : <Mono color={color.zinc600}>…</Mono>} />
              </div>
            </AppWindow>
          </div>

          <div style={{ position: "absolute", left: client.x, top: client.y, ...deal(frame, beat(0.6), 2, 160) }}>
            <Card radius={24} bezel glow style={{ width: client.w - 18, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Logo name="hyper-fetch" size={28} />
                <span style={{ fontFamily: body, fontWeight: 700, fontSize: 25, color: color.zinc100 }}>HyperFetch client</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STAGES.map((stage, k) => {
                  const l = lit(k);
                  return (
                    <div
                      key={stage}
                      style={{
                        height: 56,
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 18px",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 22,
                        color: l > 0.05 ? color.goldLight : color.zinc400,
                        background: `rgba(251,198,70,${0.04 + l * 0.14})`,
                        boxShadow: `inset 0 0 0 1px rgba(251,198,70,${0.12 + l * 0.6}), 0 0 ${l * 30}px rgba(245,166,35,${l * 0.4})`,
                      }}
                    >
                      {stage}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {SERVERS.map((sv, i) => (
            <div key={sv.label} style={{ position: "absolute", left: 1460, top: sv.y, ...deal(frame, beat(0.9) + i * 6, i + 3, 160) }}>
              <Card radius={22} bezel style={{ width: 242, height: 102, display: "flex", alignItems: "center", gap: 16, padding: "0 22px" }}>
                <Logo name={sv.logo} size={40} />
                <span style={{ fontFamily: body, fontWeight: 600, fontSize: 22, color: color.zinc200 }}>{sv.label}</span>
              </Card>
            </div>
          ))}

          <div style={{ position: "absolute", left: 0, top: 470 }}>
            <CodeWindow code={DASH_CODE} lineNumbers={false} fontSize={21} width={1100} delay={beat(1)} marks={[{ lines: [1, 1], from: sendAt(0) - 10, until: sendAt(1) - 10 }, { lines: [2, 2], from: sendAt(1) - 10, until: sendAt(2) }]} />
          </div>

          {WIDGETS.map((w, i) => (
            <React.Fragment key={w.label}>
              <Sfx at={sendAt(i)} name="swish" volume={0.35} />
              <Sfx at={sendAt(i) + 50} name="pop" volume={0.45} />
            </React.Fragment>
          ))}
          <Sfx at={dupAt + 18} name="tick" volume={0.55} />
          <Sfx at={dupAt + 30} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

const LOGOS = [
  { logo: "trpc", label: "tRPC" },
  { logo: "orpc", label: "oRPC" },
  { logo: "hono", label: "Hono" },
  { logo: "elysia", label: "Elysia" },
];

export const backendsVideo: VideoDefinition = {
  id: "TypedBackends",
  post: "hyper-fetch-10-backends",
  pattern: "striped",
  mask: "left",
  scenes: [
    { id: "hook", node: <Hook words={["Schema.", "Codegen.", "Types.", "Again."]} line="Your server already knows its types." gold={["already"]} /> },
    {
      id: "intro",
      node: <Intro title="Typed Clients From Your Backend" description="Four backends, straight into createSdk." gold={["Backend"]} titleSize={120} logos={LOGOS} />,
    },
    { id: "four", node: <Four /> },
    { id: "trpc", node: <Trpc /> },
    { id: "elysia", node: <Elysia /> },
    { id: "subscriptions", node: <Subscriptions /> },
    { id: "same-request", node: <SameRequest /> },
    { id: "slam-codegen", node: <Slam first="Zero" second="codegen." /> },
    { id: "slam-any", node: <Slam first="Any backend." second="One client." /> },
    { id: "outro", node: <Outro install="npm install @hyper-fetch/core @hyper-fetch/trpc" post="hyper-fetch-10-backends" logos={LOGOS} /> },
  ],
};
