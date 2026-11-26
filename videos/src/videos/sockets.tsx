import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, progress, rise, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Stack } from "../brand/Timeline";
import { body, color, display, mono } from "../brand/tokens";
import { Card, Chip, Eyebrow, Logo, type LogoItem, LogoStrip, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";

import { Outro } from "../scenes/Outro";
import { AppWindow } from "../visuals/app";
import { Beam, Mono, Row } from "../visuals/common";

/*
 * Sockets in HyperFetch 10: delivery strategies, typed subscription payloads, the listener lifecycle, one
 * reconnection engine and sockets in every runtime. Few words per scene: the animation carries the idea, and
 * every hit sits on the beat grid (see motion.beat).
 */

const LOGOS: LogoItem[] = [
  { logo: "sockets", label: "WebSocket" },
  { logo: "sse", label: "SSE" },
  { logo: "node", label: "Node.js" },
  { logo: "bun", label: "Bun" },
  { logo: "deno", label: "Deno" },
];

/* ------------------------------------------------------------------------------------------ delivery */

/* A deterministic message stream: five to nine messages per frame, a few hundred per second */
const perFrame = (f: number) => 5 + (((f + 11) * 2654435761) >>> 0) % 5;
const jitter = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const LANE_W = 1080;
const SPEED = 20;

const Lane: React.FC<{ at: number; name: string; option?: string; count: number; unit: string; tone: string; children: React.ReactNode }> = ({
  at,
  name,
  option,
  count,
  unit,
  tone,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={rise(frame, at, 24)}>
      <Card radius={24} lit={false} style={{ display: "flex", alignItems: "center", gap: 30, padding: "18px 30px", width: 1640, height: 176 }}>
        <div style={{ width: 250, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em", color: color.zinc100 }}>{name}</div>
          {option && (
            <Mono size={22} color={color.zinc400}>
              {option}
            </Mono>
          )}
        </div>
        <div style={{ position: "relative", width: LANE_W, height: 136, overflow: "hidden", borderRadius: 14, background: "rgba(0,0,0,0.25)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
          {children}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(28,28,29,0.9), transparent 18%)" }} />
        </div>
        <div style={{ width: 190, textAlign: "right" }}>
          <div style={{ fontFamily: display, fontWeight: 900, fontSize: 58, letterSpacing: "-0.04em", color: tone, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {count.toLocaleString("en-US")}
          </div>
          <div style={{ marginTop: 6, fontFamily: body, fontSize: 22, color: color.zinc500 }}>{unit}</div>
        </div>
      </Card>
      <Sfx at={at} name="tick" volume={0.5} />
    </div>
  );
};

const Delivery: React.FC = () => {
  const frame = useCurrentFrame();
  const streamFrom = beat(1);
  /* The stream stops on beat 11, so the counters land and hold */
  const stopAt = beat(11);
  const elapsed = Math.max(0, Math.min(frame, stopAt) - streamFrom);
  let messages = 0;
  for (let f = 0; f < elapsed; f += 1) messages += perFrame(f);
  const window = 60;
  const recent = Array.from({ length: Math.min(elapsed, window) }, (_, i) => elapsed - 1 - i);
  const batches = Array.from({ length: Math.floor(elapsed / 6) }, (_, i) => i).filter((b) => elapsed - (b + 1) * 6 < window);
  return (
    <Stack
      top={130}
      gap={70}
      copy={
        <>
          <Eyebrow>Delivery strategies</Eyebrow>
          <Title size={92} align="center" delay={4}>
            Hundreds of updates. One render.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <Lane at={beat(0.2)} name="socket" count={messages} unit="messages" tone={color.zinc200}>
            <svg width={LANE_W} height={136}>
              {recent.flatMap((f) =>
                Array.from({ length: perFrame(f) }, (_, k) => {
                  const x = LANE_W - (elapsed - f) * SPEED - (k * SPEED) / perFrame(f) - jitter(f * 7 + k) * 4;
                  const y = 16 + jitter(f * 13 + k) * 104;
                  return <circle key={`${f}-${k}`} cx={x} cy={y} r={3.6} fill={color.bolt} opacity={0.55 + jitter(f + k * 31) * 0.4} />;
                }),
              )}
            </svg>
          </Lane>
          <Lane at={beat(2)} name="latest" option="interval: 16" count={frame >= beat(2) ? elapsed : 0} unit="renders" tone={color.bolt}>
            {frame >= beat(2) &&
              recent.map((f) => {
                const x = LANE_W - (elapsed - f) * SPEED;
                return <div key={f} style={{ position: "absolute", left: x - 3, top: 30, width: 6, height: 76, borderRadius: 3, background: color.bolt, opacity: 0.9, boxShadow: "0 0 10px rgba(251,198,70,0.6)" }} />;
              })}
          </Lane>
          <Lane at={beat(4)} name="batch" option="interval: 100" count={frame >= beat(4) ? Math.floor(elapsed / 6) : 0} unit="renders" tone={color.green}>
            {frame >= beat(4) &&
              batches.map((b) => {
                const end = (b + 1) * 6;
                let n = 0;
                for (let f = b * 6; f < end; f += 1) n += perFrame(f);
                const x = LANE_W - (elapsed - end) * SPEED;
                return (
                  <div
                    key={b}
                    style={{
                      position: "absolute",
                      left: x - 6 * SPEED + 4,
                      top: 30,
                      width: 6 * SPEED - 8,
                      height: 76,
                      borderRadius: 12,
                      background: "rgba(52,211,153,0.14)",
                      boxShadow: "inset 0 0 0 1.5px rgba(52,211,153,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: mono,
                      fontSize: 22,
                      color: color.green,
                    }}
                  >
                    [{n}]
                  </div>
                );
              })}
          </Lane>
          <Sfx at={streamFrom} name="riser" volume={0.25} />
          <Sfx at={beat(2)} name="pop" volume={0.6} />
          <Sfx at={beat(4)} name="pop" volume={0.6} />
          <Sfx at={stopAt} name="impact" volume={0.3} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ payloads */

const PAYLOADS = `
const onJobProgress = socket.createListener<JobProgress, JobInput>()({
  topic: "jobs.onProgress",
});

onJobProgress.setPayload({ jobId: "1" }).listen(({ data }) => render(data));
onJobProgress.listen(({ data }) => render(data));
`;

/* A job's progress: its name, a bar that fills to `percent` and the number */
const Progress: React.FC<{ name: string; percent: number; tone?: string }> = ({ name, percent, tone = color.bolt }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ fontFamily: body, fontWeight: 600, fontSize: 25, color: color.zinc100 }}>{name}</span>
      <span style={{ marginLeft: "auto" }}>
        <Mono size={24} color={color.zinc200}>
          {Math.round(percent)}%
        </Mono>
      </span>
    </div>
    <div style={{ height: 16, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div style={{ width: `${percent}%`, height: "100%", borderRadius: 99, background: tone === color.green ? color.green : `linear-gradient(to right, ${color.goldDark}, ${color.goldLight})`, boxShadow: `0 0 16px ${tone}` }} />
    </div>
  </div>
);

const Payloads: React.FC = () => {
  const startAt = beat(4.5);
  const errorAt = beat(8.5);
  const updates = [startAt + 24, startAt + 48, startAt + 72];
  return (
    <Stack
      top={190}
      gap={90}
      visualScale={1}
      copy={
        <>
          <Eyebrow>Subscription payloads</Eyebrow>
          <Title size={100} align="center" delay={4}>
            Typed input starts the subscription.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1600, height: 420 }}>
          <div style={{ position: "absolute", left: 0, top: 30 }}>
            <CodeWindow
              file="jobs.ts"
              code={PAYLOADS}
              fontSize={21}
              width={1030}
              delay={beat(0.2)}
              marks={[
                { lines: [1, 1], from: beat(1.5), until: startAt - 10 },
                { lines: [5, 5], from: startAt - 10, until: errorAt },
                { lines: [6, 6], from: errorAt, tone: "red" },
              ]}
              hovers={[{ line: 1, match: "JobInput", occurrence: 0, from: beat(2), until: startAt - 14, content: "type JobInput = { jobId: string }" }]}
              squiggles={[{ line: 6, match: "listen(({ data }) => render(data))", from: errorAt, message: "✗ the payload is required" }]}
            />
          </div>
          <svg width={90} height={420} style={{ position: "absolute", left: 1030, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={232} x2={90} y2={200} at={startAt - 12} />
          </svg>
          <div style={{ position: "absolute", left: 1120, top: 0 }}>
            <AppWindow address="server · jobs.onProgress" footer="subscription" status='jobId "1"' statusAt={startAt} statusTone="green" width={500} minHeight={250} at={beat(1)} order={2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {updates.map((at, i) => (
                  <Row key={at} mono enterAt={at} flashAt={at} label={<span style={{ color: color.zinc300 }}>progress</span>} value={<Mono size={22} color={color.zinc100}>{`{ percent: ${(i + 1) * 25} }`}</Mono>} />
                ))}
              </div>
            </AppWindow>
          </div>
          <Sfx at={beat(2)} name="tick" volume={0.5} />
          <Sfx at={startAt - 12} name="swish" volume={0.45} />
          <Sfx at={startAt} name="pop" volume={0.6} />
          {updates.map((at) => (
            <Sfx key={at} at={at} name="tick" volume={0.45} />
          ))}
          <Sfx at={errorAt} name="error" volume={0.55} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ lifecycle */

const LIFECYCLE = `
const { status, listen } = useListener(
  onJobProgress.setPayload({ jobId }),
);
`;

const Lifecycle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = {
    listening: beat(2.5),
    ended: beat(6.5),
    second: beat(7.5),
    failed: beat(9.5),
  };
  const percent = interpolate(frame, [t.listening, t.ended], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const failedAt = interpolate(frame, [t.second, t.failed], [0, 35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stack
      top={150}
      gap={60}
      visualScale={1}
      copy={
        <>
          <Eyebrow>Listener lifecycle</Eyebrow>
          <Title size={100} align="center" delay={4}>
            A status for every subscription.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1600, height: 580 }}>
          <div style={{ position: "absolute", left: 0, top: 190 }}>
            <CodeWindow file="job-progress.tsx" code={LIFECYCLE} fontSize={26} width={820} delay={beat(0.1)} marks={[{ lines: [1, 1], from: beat(1) }]} />
          </div>
          <svg width={160} height={580} style={{ position: "absolute", left: 820, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={275} x2={160} y2={135} at={beat(1.5)} curve={20} />
            <Beam x1={0} y1={295} x2={160} y2={445} at={t.second - 10} curve={-20} />
          </svg>
          <div style={{ position: "absolute", left: 980, top: 0 }}>
            <AppWindow address="/jobs/1" footer="status" status="ended" statusAt={t.ended} statusTone="green" width={600} minHeight={110} at={beat(0.6)} order={1}>
              <Progress name="Export report" percent={percent} tone={frame >= t.ended ? color.green : color.bolt} />
            </AppWindow>
          </div>
          <div style={{ position: "absolute", left: 980, top: 310 }}>
            <AppWindow address="/jobs/2" footer="status" status="failed" statusAt={t.failed} statusTone="red" width={600} minHeight={110} at={t.second - 20} order={4}>
              {frame < t.failed ? (
                <Progress name="Import users" percent={failedAt} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 20, height: 70, ...rise(frame, t.failed, 10) }}>
                  <span style={{ fontFamily: body, fontWeight: 600, fontSize: 25, color: color.zinc100 }}>Import users</span>
                  <span style={{ marginLeft: "auto", padding: "12px 30px", borderRadius: 14, background: color.cta, color: "#18181b", fontFamily: body, fontWeight: 700, fontSize: 24 }}>Retry</span>
                </div>
              )}
            </AppWindow>
          </div>
          <Sfx at={beat(1.5)} name="swish" volume={0.45} />
          <Sfx at={t.listening} name="pop" volume={0.55} />
          <Sfx at={t.ended} name="success" volume={0.4} />
          <Sfx at={t.second - 10} name="swish" volume={0.45} />
          <Sfx at={t.failed} name="error" volume={0.5} />
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ reconnect */

const SOCKET = `
const socket = new Socket({
  url: "wss://api.example.com",
  reconnectTime: 1000,
  minUptime: 5000,
  connectionTimeout: 5000,
});
`;

/* The backoff window of an attempt, with the moment this client picked inside it */
const JitterWindow: React.FC<{ width: number; pick: number; at: number }> = ({ width, pick, at }) => {
  const frame = useCurrentFrame();
  const grow = progress(frame, at, sec(0.35));
  const dot = progress(frame, at + 10, sec(0.3));
  return (
    <div style={{ position: "relative", width: 220, height: 22 }}>
      <div style={{ position: "absolute", left: 0, top: 7, width: width * grow, height: 8, borderRadius: 99, background: "rgba(251,198,70,0.18)", boxShadow: "inset 0 0 0 1px rgba(251,198,70,0.4)" }} />
      <div
        style={{
          position: "absolute",
          left: width * pick - 8,
          top: 3,
          width: 16,
          height: 16,
          borderRadius: 99,
          background: color.bolt,
          boxShadow: "0 0 12px rgba(251,198,70,0.9)",
          opacity: dot,
          transform: `scale(${dot})`,
        }}
      />
    </div>
  );
};

const ADAPTERS: LogoItem[] = [
  { logo: "sockets", label: "WebSocket" },
  { logo: "sse", label: "SSE" },
  { logo: "graphql", label: "graphql-ws" },
  { logo: "trpc", label: "tRPC" },
  { logo: "orpc", label: "oRPC" },
];

const Reconnect: React.FC = () => {
  const t = {
    up: beat(0.5),
    lost: beat(2),
    a1: beat(3.5),
    a2: beat(5),
    a3: beat(7),
    back: beat(8),
    reset: beat(10),
    adapters: beat(11.5),
  };
  const events: { at: number; label: string; value: React.ReactNode; state?: "error" | "pending" | "idle" }[] = [
    { at: t.up, label: "connected", value: <Chip tone="green" size={18}>open</Chip> },
    { at: t.lost, label: "connection lost", value: <Chip tone="red" size={18}>lost</Chip>, state: "error" },
    { at: t.a1, label: "attempt 1", value: <JitterWindow width={55} pick={0.7} at={t.a1} />, state: "pending" },
    { at: t.a2, label: "attempt 2 · timeout", value: <JitterWindow width={110} pick={0.35} at={t.a2} />, state: "pending" },
    { at: t.a3, label: "attempt 3", value: <JitterWindow width={220} pick={0.55} at={t.a3} />, state: "pending" },
    { at: t.back, label: "connected", value: <Chip tone="green" size={18}>open</Chip> },
  ];
  return (
    <Stack
      top={110}
      gap={40}
      visualScale={1}
      copy={
        <>
          <Eyebrow>Reconnection engine</Eyebrow>
          <Title size={92} align="center" delay={4}>
            Back online on its own.
          </Title>
        </>
      }
      visual={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <div style={{ position: "relative", width: 1600, height: 640 }}>
            <div style={{ position: "absolute", left: 0, top: 40 }}>
              <CodeWindow
                file="socket.ts"
                code={SOCKET}
                fontSize={26}
                width={800}
                delay={beat(0.1)}
                marks={[
                  { lines: [3, 3], from: t.a1, until: t.a2 },
                  { lines: [5, 5], from: t.a2, until: t.a3 },
                  { lines: [4, 4], from: t.reset },
                ]}
              />
            </div>
            {/* The adapters on the same engine, under the code they share */}
            <div style={{ position: "absolute", left: 0, top: 420, width: 800, display: "flex" }}>
              <LogoStrip items={ADAPTERS} at={t.adapters} size={26} step={6} style={{ justifyContent: "flex-start" }} />
            </div>
            <svg width={160} height={600} style={{ position: "absolute", left: 800, top: 0, overflow: "visible" }}>
              <Beam x1={0} y1={210} x2={160} y2={210} at={t.a1 - 12} />
            </svg>
            <div style={{ position: "absolute", left: 960, top: 0 }}>
              <AppWindow address="wss://api.example.com" footer="engine" status="attempts reset" statusAt={t.reset} statusTone="gold" width={640} minHeight={0} at={beat(0.3)} order={2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {events.map((e) => (
                    <Row key={`${e.label}-${e.at}`} enterAt={e.at} flashAt={e.at} label={e.label} value={e.value} state={e.state} />
                  ))}
                </div>
              </AppWindow>
            </div>
          </div>
          {events.map((e, i) => (
            <Sfx key={e.at} at={e.at} name={i === 1 ? "glitch" : i === 5 ? "success" : "tick"} volume={i === 5 ? 0.35 : 0.5} />
          ))}
          <Sfx at={t.a1 - 12} name="swish" volume={0.4} />
          <Sfx at={t.reset} name="pop" volume={0.5} />
          {ADAPTERS.map((a, i) => (
            <Sfx key={a.label} at={t.adapters + i * 6} name="tick" volume={0.4} />
          ))}
        </div>
      }
    />
  );
};

/* ------------------------------------------------------------------------------------------ runtimes */

const SSE = `
const onTick = sseSocket.createListener<{ count: number }>()({ topic: "tick" });
onTick.listen(({ data }) => console.log(data.count));
`;

const RUNTIMES = [
  { logo: "node", name: "Node.js", cmd: "node ticks.ts" },
  { logo: "bun", name: "Bun", cmd: "bun ticks.ts" },
  { logo: "deno", name: "Deno", cmd: "deno run -A ticks.ts" },
];

const Runtimes: React.FC = () => {
  const ticks = [beat(5.5), beat(7), beat(8.5)];
  const doneAt = ticks[2] + 14;
  return (
    <Stack
      top={140}
      gap={64}
      visualScale={1}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Logo name="sse" size={34} />
            <Eyebrow>Any runtime</Eyebrow>
          </div>
          <Title size={100} align="center" delay={4}>
            Node.js, Bun and Deno.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", width: 1600, height: 560 }}>
          <div style={{ position: "absolute", left: 160, top: 0 }}>
            <CodeWindow file="ticks.ts" code={SSE} fontSize={23} width={1280} delay={beat(0.2)} marks={[{ lines: [1, 1], from: beat(2) }]} />
          </div>
          <svg width={1600} height={620} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {RUNTIMES.map((r, i) => (
              <Beam key={r.name} x1={800 + (i - 1) * 200} y1={174} x2={250 + i * 550} y2={290} at={beat(3) + i * 6} orient="vertical" />
            ))}
          </svg>
          {RUNTIMES.map((r, i) => (
            <div key={r.name} style={{ position: "absolute", left: i * 550, top: 290 }}>
              <AppWindow
                address={r.cmd}
                headerRight={
                  <>
                    <Logo name={r.logo} size={30} />
                    <span style={{ fontFamily: body, fontWeight: 600, fontSize: 22, color: color.zinc200 }}>{r.name}</span>
                  </>
                }
                footer="event: tick"
                status="3 received"
                statusAt={doneAt + i * 4}
                statusTone="green"
                width={500}
                minHeight={150}
                at={beat(1) + i * 6}
                order={i}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: mono, fontSize: 26 }}>
                  {ticks.map((at, k) => (
                    <TerminalLine key={at} at={at + i * 3} text={String(k + 1)} />
                  ))}
                </div>
              </AppWindow>
            </div>
          ))}
          {ticks.map((at) => (
            <Sfx key={at} at={at} name="pop" volume={0.5} />
          ))}
          {RUNTIMES.map((r, i) => (
            <Sfx key={r.name} at={beat(3) + i * 6} name="swish" volume={0.35} />
          ))}
          <Sfx at={doneAt} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

/* One line of terminal output, printed at a frame */
const TerminalLine: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const frame = useCurrentFrame();
  if (frame < at) return <div style={{ height: 40 }} />;
  const p = progress(frame, at, 8);
  return (
    <div style={{ height: 40, display: "flex", alignItems: "center", gap: 16, opacity: p, color: color.zinc100 }}>
      <span style={{ color: color.zinc600 }}>›</span>
      {text}
    </div>
  );
};

export const socketsVideo: VideoDefinition = {
  id: "Sockets",
  post: "hyper-fetch-10-sockets",
  pattern: "hexagon",
  mask: "sides",
  scenes: [
    { id: "hook", node: <Hook words={["Drop.", "Retry.", "Backoff.", "Reconnect."]} line="Sockets that recover on their own." gold={["recover"]} /> },
    { id: "intro", node: <Intro title="Sockets in HyperFetch 10" description="Throttled, typed and back online on their own." gold={["Sockets"]} titleSize={124} logos={LOGOS} /> },
    { id: "delivery", node: <Delivery /> },
    { id: "payloads", node: <Payloads /> },
    { id: "lifecycle", node: <Lifecycle /> },
    { id: "reconnect", node: <Reconnect /> },
    { id: "runtimes", node: <Runtimes /> },
    { id: "slam-smooth", node: <Slam first="Smooth" second="streams." /> },
    { id: "slam-everywhere", node: <Slam first="Runs" second="everywhere." /> },
    { id: "outro", node: <Outro install="npm install @hyper-fetch/sockets@10" post="hyper-fetch-10-sockets" logos={LOGOS} /> },
  ],
};
