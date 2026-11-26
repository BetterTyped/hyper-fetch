import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, easeInOut, pop, progress, rise, sec } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Split, Stack } from "../brand/Timeline";
import { body, color, mono } from "../brand/tokens";
import { Card, Chip, Eyebrow, Logo, LogoChip, LogoStrip, Title } from "../brand/ui";
import { AppWindow } from "../visuals/app";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";

import { Outro } from "../scenes/Outro";
import { Beam, Row, StatusDot, TypingSfx } from "../visuals/common";

/*
 * HyperFlow, Linting and Examples: the Socket Inspector, devtools on the server, the Oxlint race, the 92 runnable
 * examples and the agent skills. One eyebrow and one title per scene; logos for everything named. Numbers and code
 * come from the tooling post.
 */

/* The plugin call from the post's client.ts */
const INSPECTOR_CODE = `
DevtoolsPlugin({
  appName: "My App",
  sockets: [socket],
}),
`;

/* A label pinned to a point of the screenshot. It lands once and stays still */
const Callout: React.FC<{ x: number; y: number; at: number; children: React.ReactNode; side?: "left" | "right" }> = ({ x, y, at, children, side = "right" }) => {
  const frame = useCurrentFrame();
  const s = pop(frame, at, 14);
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: 0, height: 0 }}>
      <span style={{ position: "absolute", left: -8, top: -8, width: 16, height: 16, borderRadius: 99, background: color.bolt, boxShadow: "0 0 18px rgba(251,198,70,0.9)", transform: `scale(${s})` }} />
      <div
        style={{
          position: "absolute",
          top: -26,
          [side === "right" ? "left" : "right"]: 26,
          whiteSpace: "nowrap",
          opacity: Math.min(1, s * 1.5),
          transform: `translateX(${(1 - s) * (side === "right" ? -20 : 20)}px)`,
        }}
      >
        <Chip tone="gold" size={26} style={{ background: "rgba(28,28,29,0.94)", padding: "9px 20px" }}>
          {children}
        </Chip>
      </div>
    </div>
  );
};

const Inspector: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [beat(6), beat(15)], [1, 1.16], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const shotIn = rise(frame, beat(0.3), 40, sec(0.6));
  const W = 1150;
  const H = (W * 1600) / 2560;
  return (
    <Split
      copyWidth={480}
      gap={70}
      copy={
        <>
          <div style={rise(frame, 2)}>
            <LogoChip logo="hyper-flow" size={26}>
              HyperFlow
            </LogoChip>
          </div>
          <Eyebrow>Socket Inspector</Eyebrow>
          <Title size={92} delay={4}>
            See every socket.
          </Title>
          <div style={{ marginTop: 18, ...rise(frame, beat(1)) }}>
            <CodeWindow file="client.ts" code={INSPECTOR_CODE} fontSize={23} width={480} glow={false} lineNumbers={false} marks={[{ lines: [3, 3], from: beat(2) }]} />
          </div>
        </>
      }
      visual={
        <div style={{ position: "relative", width: W, height: H, ...shotIn }}>
          <div style={{ position: "absolute", left: "8%", right: "8%", bottom: -40, height: 80, borderRadius: 99, background: "rgba(234,179,8,0.22)", filter: "blur(50px)" }} />
          {/* Double bezel: a translucent outer shell around the screenshot, then a sheen once it lands */}
          <div
            style={{
              position: "absolute",
              inset: -9,
              borderRadius: 32,
              background: "rgba(255,255,255,0.04)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.12), 0 60px 120px -30px rgba(0,0,0,0.85)",
            }}
          />
          <div style={{ position: "relative", width: W, height: H, borderRadius: 23, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}>
            <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "62% 72%" }}>
              <Img src={staticFile("hyper-flow/sockets.webp")} style={{ width: W, height: H, display: "block" }} />
              <Callout x={0.86} y={0.18} at={beat(3)} side="left">
                status
              </Callout>
              <Callout x={0.24} y={0.33} at={beat(5)}>
                in · out · events
              </Callout>
              <Callout x={0.52} y={0.6} at={beat(7)}>
                every message
              </Callout>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.03) 54%, transparent 62%)",
                transform: `translateX(${interpolate(frame, [beat(1), beat(2.5)], [-110, 110], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut })}%)`,
              }}
            />
          </div>
          <Sfx at={beat(3)} name="pop" volume={0.55} />
          <Sfx at={beat(5)} name="pop" volume={0.55} />
          <Sfx at={beat(7)} name="pop" volume={0.55} />
        </div>
      }
    />
  );
};

const SERVER_CODE = `DevtoolsPlugin({ appName: "My API", environment: "backend" })`;

const Server: React.FC = () => {
  const markAt = beat(2.5);
  const apiAt = beat(4.5);
  return (
    <Stack
      top={230}
      gap={80}
      visualScale={1.0}
      copy={
        <>
          <Eyebrow>Devtools on servers</Eyebrow>
          <Title size={104} align="center" delay={4}>
            Your API shows up too.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 120 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "flex-start" }}>
            <LogoStrip
              at={beat(0.3)}
              size={26}
              step={10}
              items={[
                { logo: "node", label: "Node.js" },
                { logo: "deno", label: "Deno" },
                { logo: "bun", label: "Bun" },
              ]}
            />
            <CodeWindow file="server.ts" code={SERVER_CODE} fontSize={22} width={960} delay={beat(0.8)} lineNumbers={false} marks={[{ lines: [1, 1], from: markAt }]} />
          </div>
          <svg width={120} height={300} style={{ position: "absolute", left: 960, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={170} x2={120} y2={150} at={markAt + 14} duration={apiAt - markAt - 14} />
          </svg>
          <AppWindow
            address="HyperFlow"
            headerRight={<Logo name="hyper-flow" size={26} />}
            footer="applications"
            status="2 connected"
            statusAt={apiAt + 12}
            width={600}
            minHeight={170}
            at={beat(0.6)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Row icon={<StatusDot tone="green" />} label="My App" value={<Chip size={18}>frontend</Chip>} />
              <Row icon={<StatusDot tone="green" />} label="My API" enterAt={apiAt} flashAt={apiAt} value={<Chip tone="gold" size={18}>backend</Chip>} />
            </div>
          </AppWindow>
          <Sfx at={markAt} name="tick" volume={0.5} />
          <Sfx at={markAt + 14} name="swish" volume={0.5} />
          <Sfx at={apiAt} name="pop" volume={0.6} />
          <Sfx at={apiAt + 12} name="success" volume={0.3} />
        </div>
      }
    />
  );
};

/* One lane of the lint race */
const Lane: React.FC<{ logo: string; name: string; seconds: number; start: number; scale: number; width: number; winner?: boolean }> = ({
  logo,
  name,
  seconds,
  start,
  scale,
  width,
  winner,
}) => {
  const frame = useCurrentFrame();
  const doneAt = start + seconds * scale;
  const p = progress(frame, start, Math.max(1, doneAt - start), (t) => t);
  const shown = Math.min(seconds, Math.max(0, (frame - start) / scale));
  const done = frame >= doneAt;
  const c = winner ? color.bolt : color.zinc400;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div style={{ width: 270, display: "flex", alignItems: "center", gap: 18 }}>
        <Logo name={logo} size={62} />
        <span style={{ fontFamily: body, fontWeight: 600, fontSize: 38, color: color.zinc100 }}>{name}</span>
      </div>
      <div style={{ position: "relative", width, height: 40, borderRadius: 99, background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: width * p,
            borderRadius: 99,
            background: winner ? `linear-gradient(to right, ${color.goldDark}, ${color.goldLight})` : `linear-gradient(to right, ${color.zinc700}, ${color.zinc500})`,
            boxShadow: winner ? "0 0 24px rgba(251,198,70,0.6)" : undefined,
          }}
        />
      </div>
      <span style={{ width: 190, textAlign: "right", fontFamily: mono, fontSize: 46, fontWeight: 700, color: done ? c : color.zinc300, fontVariantNumeric: "tabular-nums" }}>
        {(done ? seconds : shown).toFixed(seconds < 10 ? 2 : 1)}s
      </span>
      <Sfx at={doneAt} name={winner ? "ding" : "tick"} volume={winner ? 0.45 : 0.5} />
    </div>
  );
};

const Oxlint: React.FC = () => {
  const frame = useCurrentFrame();
  const start = beat(1.5);
  /* ESLint's 17.8s plays in six beats; Oxlint's 1.09s on the same scale */
  const scale = (beat(7.5) - start) / 17.8;
  return (
    <Stack
      top={200}
      visualScale={1.0}
      gap={140}
      copy={
        <>
          <Eyebrow>Oxlint plugin</Eyebrow>
          <Title size={120} align="center" delay={4} gold={["16x"]}>
            Lint 16x faster.
          </Title>
        </>
      }
      visual={
        <div style={rise(frame, beat(0.5))}>
          <Card radius={34} glow style={{ padding: "52px 64px", display: "flex", flexDirection: "column", gap: 50 }}>
            <div style={{ fontFamily: mono, fontSize: 26, color: color.zinc500 }}>4960 files</div>
            <Lane logo="oxlint" name="Oxlint" seconds={1.09} start={start} scale={scale} width={1000} winner />
            <Lane logo="eslint" name="ESLint" seconds={17.8} start={start} scale={scale} width={1000} />
          </Card>
          <Sfx at={start} name="swish" volume={0.5} />
        </div>
      }
    />
  );
};

/* Real examples from the catalog, under two of its ten groups */
const CATALOG: { group: string; names: string[] }[] = [
  { group: "offline", names: ["offline-first", "offline-queue", "resume-after-reload"] },
  { group: "realtime", names: ["websocket-chat", "server-sent-events"] },
];
const TIGED = "npx tiged BetterTyped/hyper-fetch/examples/offline/offline-first my-app";

const Examples: React.FC = () => {
  const frame = useCurrentFrame();
  const pickAt = beat(4);
  const typeFrom = beat(5);
  const cps = 40;
  let n = 0;
  return (
    <Stack
      top={140}
      gap={70}
      visualScale={0.94}
      copy={
        <>
          <Eyebrow>Runnable examples</Eyebrow>
          <Title size={104} align="center" delay={4}>
            Start from a working app.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 110 }}>
          <AppWindow address="/examples" footer="catalog" status="92 examples" statusAt={beat(3)} width={620} minHeight={380} at={beat(0.3)} order={1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATALOG.map((g) => (
                <React.Fragment key={g.group}>
                  <div style={{ fontFamily: body, fontWeight: 600, fontSize: 19, color: color.zinc500, textTransform: "uppercase", letterSpacing: "0.1em", margin: "8px 4px 2px" }}>{g.group}</div>
                  {g.names.map((name) => {
                    n += 1;
                    return <Row key={name} mono label={name} enterAt={beat(0.8) + n * 4} flashAt={name === "offline-first" ? pickAt : undefined} />;
                  })}
                </React.Fragment>
              ))}
            </div>
          </AppWindow>
          <svg width={110} height={600} style={{ position: "absolute", left: 620, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={120} x2={110} y2={250} at={pickAt + 6} duration={typeFrom - pickAt - 6} />
          </svg>
          <div style={rise(frame, beat(3.5))}>
            <CodeWindow file="terminal" lang="bash" code={TIGED} fontSize={20} width={900} lineNumbers={false} typeFrom={typeFrom} cps={cps} glow={false} />
          </div>
          <Sfx at={pickAt} name="pop" volume={0.6} />
          <Sfx at={pickAt + 6} name="swish" volume={0.5} />
          <TypingSfx from={typeFrom} chars={TIGED.length} cps={cps} every={4} />
          <Sfx at={beat(3)} name="tick" volume={0.45} />
        </div>
      }
    />
  );
};

/* Skill folders from the repository's skills/ directory, as an agent installs them */
const SKILL_ROWS: { name: string; logo: string }[] = [
  { name: "hyper-fetch-core", logo: "hyper-fetch" },
  { name: "hyper-fetch-react", logo: "react" },
  { name: "hyper-fetch-sockets", logo: "sockets" },
  { name: "hyper-fetch-graphql", logo: "graphql" },
  { name: "hyper-fetch-trpc", logo: "trpc" },
  { name: "hyper-fetch-firebase", logo: "firebase" },
];
const SKILLS_CMD = "npx skills add BetterTyped/hyper-fetch/skills";

const Skills: React.FC = () => {
  const typeFrom = beat(1);
  const cps = 30;
  const typedAt = typeFrom + (SKILLS_CMD.length / cps) * 60;
  const dealFrom = typedAt + 24;
  return (
    <Stack
      top={120}
      gap={70}
      visualScale={0.96}
      copy={
        <>
          <Eyebrow>Agent skills</Eyebrow>
          <Title size={104} align="center" delay={4}>
            Your agent knows HyperFetch.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 120 }}>
          <CodeWindow file="terminal" lang="bash" code={SKILLS_CMD} fontSize={25} width={860} delay={beat(0.3)} typeFrom={typeFrom} cps={cps} lineNumbers={false} />
          <svg width={120} height={300} style={{ position: "absolute", left: 860, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={255} x2={120} y2={200} at={typedAt + 4} duration={dealFrom - typedAt - 4} />
          </svg>
          <AppWindow
            address=".claude/skills"
            headerRight={
              <>
                <Logo name="claude" size={24} />
                <Logo name="cursor" size={24} />
              </>
            }
            footer="installed"
            status="15 skills"
            statusAt={dealFrom + SKILL_ROWS.length * 6 + 6}
            width={620}
            minHeight={420}
            at={beat(0.6)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SKILL_ROWS.map((r, i) => (
                <Row key={r.name} mono icon={<Logo name={r.logo} size={28} />} label={r.name} enterAt={dealFrom + i * 6} />
              ))}
            </div>
          </AppWindow>
          <TypingSfx from={typeFrom} chars={SKILLS_CMD.length} cps={cps} every={4} />
          <Sfx at={typedAt + 4} name="swish" volume={0.5} />
          {SKILL_ROWS.map((r, i) => (i % 2 === 0 ? <Sfx key={r.name} at={dealFrom + i * 6} name="tick" volume={0.4} /> : null))}
          <Sfx at={dealFrom + SKILL_ROWS.length * 6 + 6} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

export const toolingVideo: VideoDefinition = {
  id: "Tooling",
  post: "hyper-fetch-10-tooling",
  pattern: "interactive",
  mask: "rectangle",
  scenes: [
    { id: "hook", node: <Hook words={["Sockets.", "Servers.", "Lint.", "Examples."]} line="Tooling that keeps up with v10." gold={["v10."]} /> },
    {
      id: "intro",
      node: (
        <Intro
          title="HyperFlow, Linting and Examples"
          description="See your sockets, lint 16x faster, start from 92 apps."
          gold={["HyperFlow,"]}
          titleSize={128}
          logos={[
            { logo: "hyper-flow", label: "HyperFlow" },
            { logo: "oxlint", label: "Oxlint" },
            { logo: "eslint", label: "ESLint" },
          ]}
        />
      ),
    },
    { id: "inspector", node: <Inspector /> },
    { id: "server", node: <Server /> },
    { id: "oxlint", node: <Oxlint /> },
    { id: "examples", node: <Examples /> },
    { id: "skills", node: <Skills /> },
    { id: "slam-see", node: <Slam first="See" second="everything." /> },
    { id: "slam-ship", node: <Slam first="Ship" second="faster." /> },
    {
      id: "outro",
      node: (
        <Outro
          install={SKILLS_CMD}
          post="hyper-fetch-10-tooling"
          logos={[
            { logo: "hyper-flow", label: "HyperFlow" },
            { logo: "oxlint", label: "Oxlint" },
            { logo: "claude", label: "Claude" },
          ]}
        />
      ),
    },
  ],
};
