import React from "react";
import { useCurrentFrame } from "remotion";

import { CodeWindow } from "../brand/CodeWindow";
import type { VideoDefinition } from "../brand/LaunchVideo";
import { beat, rise } from "../brand/motion";
import { Sfx } from "../brand/Sfx";
import { Split, Stack } from "../brand/Timeline";
import { body, color, mono } from "../brand/tokens";
import { Chip, Eyebrow, Logo, Title } from "../brand/ui";
import { Hook } from "../scenes/Hook";
import { Intro } from "../scenes/Intro";
import { Slam } from "../scenes/Slam";

import { Outro } from "../scenes/Outro";
import { AppWindow } from "../visuals/app";
import { Beam, EventPill, Mono, Panel, Row, StatusDot, Swap, TypingSfx } from "../visuals/common";

/*
 * Typed Firebase Queries: a typo that now fails to compile, constraints as an array, listeners with the same query
 * params, and reliable writes and listeners. One eyebrow and one title per scene; the animation does the explaining. Code
 * is cut from the Firebase post.
 */

/* A short label pinned under the code, part of the visual */
const Callout: React.FC<{ at: number; tone: "red" | "green"; left: number; children: React.ReactNode }> = ({ at, tone, left, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left, bottom: -74, ...rise(frame, at, 12) }}>
      <Chip tone={tone} size={26} style={{ fontFamily: mono, fontWeight: 500, padding: "10px 20px" }}>
        {children}
      </Chip>
    </div>
  );
};

const TYPO_HEAD = `queryParams?: FirestoreQueryParams<Tea>;

`;
const TYPO_LINE = `getTeas.setQueryParams((c) => c.where("yaer", ">=", "2020"));`;
const FIXED_LINE = `getTeas.setQueryParams((c) => c.where("year", ">=", 2020));`;

const Typo: React.FC = () => {
  const frame = useCurrentFrame();
  const typeFrom = beat(1.5);
  const cps = 26;
  const typedAt = typeFrom + (TYPO_LINE.length / cps) * 60;
  const errorAt = beat(6.5);
  const fixAt = beat(11);
  const fixed = frame >= fixAt;
  return (
    <Stack
      top={210}
      gap={120}
      visualScale={1.12}
      copy={
        <>
          <Eyebrow>Typed constraints</Eyebrow>
          <Title size={108} align="center" delay={4}>
            Typos fail to compile.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative" }}>
          {!fixed ? (
            <CodeWindow
              file="teas.ts"
              code={TYPO_HEAD + TYPO_LINE}
              fontSize={34}
              width={1480}
              delay={0}
              typeFrom={typeFrom}
              typeFromChar={TYPO_HEAD.length}
              cps={cps}
              marks={[
                { lines: [1, 1], from: beat(0.5), until: typeFrom },
                { lines: [3, 3], from: errorAt, tone: "red" },
              ]}
              squiggles={[
                { line: 3, match: '"yaer"', from: errorAt },
                { line: 3, match: '"2020"', from: errorAt + 15 },
              ]}
            />
          ) : (
            <CodeWindow file="teas.ts" code={TYPO_HEAD + FIXED_LINE} fontSize={34} width={1480} delay={-120} marks={[{ lines: [3, 3], from: fixAt, tone: "green" }]} />
          )}
          {!fixed && (
            <>
              <Callout at={errorAt + 6} tone="red" left={790}>
                ✗ unknown field
              </Callout>
              <Callout at={errorAt + 21} tone="red" left={1110}>
                ✗ not a number
              </Callout>
            </>
          )}
          {fixed && (
            <Callout at={fixAt} tone="green" left={790}>
              ✓ compiles
            </Callout>
          )}
          <TypingSfx from={typeFrom} chars={TYPO_LINE.length} cps={cps} every={4} />
          <Sfx at={typedAt} name="tick" volume={0.4} />
          <Sfx at={errorAt} name="error" volume={0.55} />
          <Sfx at={errorAt + 15} name="error" volume={0.4} />
          <Sfx at={fixAt} name="swish" volume={0.5} />
          <Sfx at={fixAt + 4} name="success" volume={0.4} />
        </div>
      }
    />
  );
};

const ARRAY_CODE = `
const constraints: FirestoreConstraint[] = [];
if (onlyGreen) constraints.push($where("type", "==", "Green"));
constraints.push($orderBy("year", "desc"));

getTeas.setQueryParams(constraints);
`;

const ALL_TEAS = [
  { name: "Assam", type: "Black", year: 2022 },
  { name: "Matcha", type: "Green", year: 2021 },
  { name: "Darjeeling", type: "Black", year: 2023 },
  { name: "Sencha", type: "Green", year: 2024 },
  { name: "Gyokuro", type: "Green", year: 2023 },
];
const SORTED = ALL_TEAS.filter((t) => t.type === "Green").sort((x, y) => y.year - x.year);

const TeaValue: React.FC<{ type: string; year: number }> = ({ type, year }) => (
  <Mono color={type === "Green" ? color.green : color.zinc500}>
    {type} · {year}
  </Mono>
);

/* The constraints code, a beam, and the teas screen: black teas drop out, then the list sorts newest first */
const ArrayScene: React.FC = () => {
  const frame = useCurrentFrame();
  const whereAt = beat(2);
  const orderAt = beat(3.5);
  const sendAt = beat(5);
  const filterAt = beat(6.5);
  const sortAt = beat(8);
  const sorted = frame >= sortAt;
  return (
    <Stack
      top={170}
      gap={80}
      visualScale={0.98}
      copy={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Logo name="firebase" size={34} />
            <Eyebrow>Constraints array</Eyebrow>
          </div>
          <Title size={104} align="center" delay={4}>
            Filters as an array.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 120 }}>
          <CodeWindow
            file="teas.ts"
            code={ARRAY_CODE}
            fontSize={22}
            width={960}
            delay={beat(0.3)}
            marks={[
              { lines: [2, 2], from: whereAt, until: orderAt },
              { lines: [3, 3], from: orderAt, until: sendAt },
              { lines: [5, 5], from: sendAt },
            ]}
          />
          <svg width={120} height={400} style={{ position: "absolute", left: 960, top: 0, overflow: "visible" }}>
            <Beam x1={0} y1={250} x2={120} y2={200} at={sendAt + 10} duration={filterAt - sendAt - 10} />
          </svg>
          <AppWindow
            address="/teas"
            headerRight={<Logo name="firebase" size={24} />}
            footer="firestore"
            status={frame >= filterAt ? "3 results" : "5 results"}
            statusAt={beat(1)}
            statusTone={frame >= filterAt ? "green" : "zinc"}
            width={580}
            minHeight={250}
            at={beat(0.6)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!sorted
                ? ALL_TEAS.map((t) => (
                    <Row key={t.name} label={t.name} exitAt={t.type === "Black" ? filterAt : undefined} value={<TeaValue type={t.type} year={t.year} />} />
                  ))
                : SORTED.map((t, i) => <Row key={t.name} label={t.name} flashAt={sortAt + i * 3} value={<TeaValue type={t.type} year={t.year} />} />)}
            </div>
          </AppWindow>
          <Sfx at={whereAt} name="tick" volume={0.5} />
          <Sfx at={orderAt} name="tick" volume={0.5} />
          <Sfx at={sendAt + 10} name="swish" volume={0.5} />
          <Sfx at={filterAt} name="glitch" volume={0.35} />
          <Sfx at={sortAt} name="pop" volume={0.6} />
          <Sfx at={sortAt + 8} name="success" volume={0.35} />
        </div>
      }
    />
  );
};

const LISTENER_CODE = `
socket
  .createListener<Tea[]>()({ topic: "teas" })
  .setQueryParams((c) => c.where("type", "==", "Green"));
`;

const Listeners: React.FC = () => {
  const snapAt = beat(5);
  const snap2At = beat(8);
  const teas = [
    { name: "Shincha", year: 2025, at: snapAt },
    { name: "Sencha", year: 2024 },
    { name: "Gyokuro", year: 2023 },
    { name: "Matcha", year: 2021 },
  ];
  return (
    <Split
      copyWidth={830}
      gap={70}
      visualScale={1.25}
      copy={
        <>
          <Eyebrow>Live listeners</Eyebrow>
          <Title size={104} delay={4}>
            Same query, live.
          </Title>
          <div style={{ marginTop: 26 }}>
            <CodeWindow file="teas.ts" code={LISTENER_CODE} fontSize={22} width={830} delay={beat(0.3)} marks={[{ lines: [3, 3], from: beat(1.5) }]} />
          </div>
        </>
      }
      visual={
        <div style={{ position: "relative" }}>
          <Panel
            width={640}
            delay={beat(1)}
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
                <Logo name="firebase" size={30} /> <Mono size={24}>teas</Mono>
              </span>
            }
            badge={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: body, fontSize: 21, color: color.green }}>
                <StatusDot tone="green" /> live
              </span>
            }
          >
            {teas.map((t) => (
              <Row
                key={t.name}
                label={t.name}
                enterAt={t.at}
                flashAt={t.at ?? (t.name === "Sencha" ? snap2At : undefined)}
                value={<Mono color={color.zinc400}>{t.year}</Mono>}
              />
            ))}
          </Panel>
          <EventPill at={snapAt - 30} fromX={760} toX={380} y={-60}>
            snapshot
          </EventPill>
          <EventPill at={snap2At - 30} fromX={760} toX={380} y={-60} tone="blue">
            snapshot
          </EventPill>
          <Sfx at={snapAt - 30} name="swish" volume={0.5} />
          <Sfx at={snapAt} name="pop" volume={0.6} />
          <Sfx at={snap2At - 30} name="swish" volume={0.45} />
          <Sfx at={snap2At} name="tick" volume={0.55} />
        </div>
      }
    />
  );
};

const GROUPED = `
const onTeas = socket.createListener<Tea[]>()({ topic: "teas", options: { groupByChangeType: true } });
onTeas.listen(({ data, extra }) => render(data, extra.groupedResult));
`;

/*
 * A live tea shop: one snapshot adds Gyokuro, changes the year of Sencha and removes Bancha. Without grouping a
 * listener gets the whole list and has to diff it; with groupByChangeType, extra.groupedResult says what changed.
 */
const Grouped: React.FC = () => {
  const snapAt = beat(4);
  const groupsAt = snapAt + 20;
  const groups = [
    { kind: "added", tone: "green" as const, doc: "Gyokuro", at: groupsAt },
    { kind: "modified", tone: "gold" as const, doc: "Sencha · year", at: groupsAt + 10 },
    { kind: "removed", tone: "red" as const, doc: "Bancha", at: groupsAt + 20 },
  ];
  return (
    <Stack
      top={110}
      gap={60}
      visualScale={1.02}
      copy={
        <>
          <Eyebrow>Grouped changes</Eyebrow>
          <Title size={104} align="center" delay={4}>
            Know exactly what changed.
          </Title>
        </>
      }
      visual={
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
          <CodeWindow file="teas.ts" code={GROUPED} fontSize={22} width={1460} delay={beat(0.3)} marks={[{ lines: [1, 1], from: beat(1.5), until: snapAt }, { lines: [2, 2], from: snapAt }]} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 110 }}>
            <AppWindow
              address="teas · live"
              headerRight={<Logo name="firebase" size={24} />}
              footer="snapshot"
              status="1 snapshot"
              statusAt={snapAt}
              width={600}
              minHeight={0}
              at={beat(0.8)}
              order={1}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Row label="Gyokuro" enterAt={snapAt} flashAt={snapAt} value={<Mono color={color.zinc400}>2025</Mono>} />
                <Row
                  label="Sencha"
                  flashAt={snapAt}
                  value={
                    <Mono color={color.zinc100}>
                      <Swap from="2024" to="2025" at={snapAt} />
                    </Mono>
                  }
                />
                <Row label="Matcha" value={<Mono color={color.zinc400}>2023</Mono>} />
                <Row label="Bancha" exitAt={snapAt} value={<Mono color={color.zinc400}>2021</Mono>} />
              </div>
            </AppWindow>
            <svg width={110} height={10} style={{ position: "absolute", left: 600, top: 150, overflow: "visible" }}>
              <Beam x1={0} y1={0} x2={110} y2={0} at={snapAt + 4} drawAt={beat(1.5)} />
            </svg>
            <AppWindow address="extra.groupedResult" footer="per change type" status="3 groups" statusAt={groups[2].at + 10} statusTone="gold" width={660} minHeight={0} at={beat(1.2)} order={4}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groups.map((g) => (
                  <Row key={g.kind} mono label={g.kind} enterAt={g.at} flashAt={g.at} value={<Chip tone={g.tone} size={18}>{g.doc}</Chip>} />
                ))}
              </div>
            </AppWindow>
          </div>
          <EventPill at={snapAt - 30} fromX={-260} toX={120} y={188}>
            snapshot
          </EventPill>
          <Sfx at={snapAt - 30} name="swish" volume={0.45} />
          <Sfx at={snapAt} name="pop" volume={0.6} />
          {groups.map((g) => (
            <Sfx key={g.kind} at={g.at} name="tick" volume={0.5} />
          ))}
          <Sfx at={groups[2].at + 10} name="success" volume={0.32} />
        </div>
      }
    />
  );
};

export const firebaseVideo: VideoDefinition = {
  id: "Firebase",
  post: "hyper-fetch-10-firebase",
  pattern: "flickering",
  mask: "bottom",
  scenes: [
    { id: "hook", node: <Hook words={["One typo.", "No error.", "No data.", "Silence."]} line="It should fail to compile." gold={["fail"]} /> },
    {
      id: "intro",
      node: (
        <Intro
          title="Typed Firebase Queries"
          description="Constraints checked against your documents."
          gold={["Firebase"]}
          titleSize={140}
          logos={[{ logo: "firebase", label: "Firebase" }]}
        />
      ),
    },
    { id: "typo", node: <Typo /> },
    { id: "array", node: <ArrayScene /> },
    { id: "listeners", node: <Listeners /> },
    { id: "reliable", node: <Grouped /> },
    { id: "slam-caught", node: <Slam first="Typos" second="caught." /> },
    { id: "slam-solid", node: <Slam first="Rock" second="solid." /> },
    {
      id: "outro",
      node: <Outro install="npm install @hyper-fetch/firebase" post="hyper-fetch-10-firebase" logos={[{ logo: "firebase", label: "Firebase" }]} />,
    },
  ],
};
