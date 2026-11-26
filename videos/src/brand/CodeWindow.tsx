import { Highlight, type PrismTheme } from "prism-react-renderer";
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { progress, rise, sec } from "./motion";
import { body, color, mono, syntax } from "./tokens";

/*
 * The blog cover's terminal window: traffic lights, a file tab, the near-black body and the amber under-glow.
 * Code is highlighted with the docs' VS Code colours and can type itself in, light up lines, show a red type
 * error squiggle with its message, a hover type and an autocomplete list. Positions come from the monospace grid,
 * so every overlay lands on the exact characters it points at.
 */

const theme: PrismTheme = {
  plain: { color: syntax.plain, backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog"], style: { color: syntax.comment } },
    { types: ["punctuation", "operator"], style: { color: syntax.punctuation } },
    { types: ["property", "property-access", "parameter", "attr-name", "variable"], style: { color: syntax.variable } },
    { types: ["number", "boolean", "constant"], style: { color: syntax.number } },
    { types: ["string", "char", "template-string", "attr-value", "url"], style: { color: syntax.string } },
    { types: ["keyword", "builtin"], style: { color: syntax.keyword } },
    { types: ["module", "control-flow"], style: { color: syntax.control } },
    { types: ["function", "method"], style: { color: syntax.fn } },
    { types: ["class-name", "maybe-class-name"], style: { color: syntax.type } },
    { types: ["tag"], style: { color: syntax.type } },
    { types: ["arrow"], style: { color: syntax.keyword } },
  ],
};

export type Squiggle = { line: number; match: string; from: number; message?: string; occurrence?: number };
export type Hover = { line: number; match: string; from: number; until?: number; content: string; occurrence?: number };
export type Complete = { line: number; after: string; from: number; until?: number; items: { label: string; kind?: string; detail?: string }[]; selected?: number };
export type LineMark = { lines: [number, number]; from: number; until?: number; tone?: "gold" | "red" | "green" };

export type CodeWindowProps = {
  code: string;
  file?: string;
  lang?: string;
  fontSize?: number;
  width?: number;
  delay?: number;
  /* Type the code in from this frame, at this many characters per second */
  typeFrom?: number;
  cps?: number;
  /* Characters already on screen before typing starts */
  typeFromChar?: number;
  marks?: LineMark[];
  /* Dim every unmarked line while a mark is active */
  focus?: boolean;
  squiggles?: Squiggle[];
  hovers?: Hover[];
  completes?: Complete[];
  lineNumbers?: boolean;
  style?: React.CSSProperties;
  glow?: boolean;
};

const LH = 1.62;

const findCol = (text: string, match: string, occurrence = 0) => {
  let idx = -1;
  for (let i = 0; i <= occurrence; i += 1) idx = text.indexOf(match, idx + 1);
  return idx;
};

export const CodeWindow: React.FC<CodeWindowProps> = ({
  code,
  file,
  lang = "tsx",
  fontSize: requestedFontSize = 26,
  width = 1100,
  delay = 0,
  typeFrom,
  cps = 55,
  typeFromChar = 0,
  marks = [],
  focus = true,
  squiggles = [],
  hovers = [],
  completes = [],
  lineNumbers = true,
  style,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const source = code.replace(/^\n+|\s+$/g, "");
  const lines = source.split("\n");
  /*
   * Fit the longest line inside the window: gutter + text + right padding, in monospace advances (0.6em). The font
   * shrinks just enough; it never grows past what was asked. The fit audit warns when it had to shrink a lot.
   */
  const longest = Math.max(...lines.map((l) => l.length));
  const gutterChars = lineNumbers ? String(lines.length).length + 2.4 : 1.2;
  const fontSize = Math.min(requestedFontSize, width / (0.6 * (gutterChars + longest) + 1.8));
  const cw = fontSize * 0.6;
  const lh = fontSize * LH;
  const gutter = lineNumbers ? cw * (String(lines.length).length + 2.4) : cw * 1.2;
  const padY = fontSize * 0.9;

  const totalChars = source.length;
  const typed =
    typeFrom === undefined
      ? totalChars
      : Math.min(totalChars, typeFromChar + Math.max(0, Math.floor(((frame - typeFrom) / 60) * cps)));
  const typing = typeFrom !== undefined && typed < totalChars && frame >= typeFrom;

  /* Character offset where each line starts, newlines counted */
  const lineStart: number[] = [];
  lines.reduce((acc, l, i) => {
    lineStart[i] = acc;
    return acc + l.length + 1;
  }, 0);

  const caretLine = (() => {
    for (let i = lines.length - 1; i >= 0; i -= 1) if (typed >= lineStart[i]) return i;
    return 0;
  })();
  const caretCol = Math.min(lines[caretLine].length, typed - lineStart[caretLine]);

  /* A mark only means something when it singles out part of the code: none on a one-line window, none that covers it all */
  const usefulMarks = lines.length <= 1 ? [] : marks.filter((m) => !(m.lines[0] <= 1 && m.lines[1] >= lines.length));
  const active = (m: { from: number; until?: number }) => frame >= m.from && (m.until === undefined || frame < m.until);
  const activeMarks = usefulMarks.filter(active);
  const focusAmount = focus
    ? Math.max(0, ...usefulMarks.map((m) => Math.min(progress(frame, m.from, sec(0.35)), m.until ? 1 - progress(frame, m.until, sec(0.35)) : 1)))
    : 0;

  const enter = rise(frame, delay, 30, sec(0.55));
  const scale = interpolate(progress(frame, delay, sec(0.6)), [0, 1], [0.97, 1]);

  return (
    <div style={{ position: "relative", width, ...style, opacity: enter.opacity, filter: enter.filter, transform: `${enter.transform} scale(${scale})` }}>
      {glow && (
        <div
          style={{
            position: "absolute",
            bottom: -34,
            left: "10%",
            width: "80%",
            height: 70,
            borderRadius: 999,
            background: "rgba(234,179,8,0.22)",
            filter: "blur(40px)",
          }}
        />
      )}
      <div
        data-solid
        style={{
          position: "relative",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(13,13,13,0.92)",
          boxShadow: "0 50px 100px -30px rgba(0,0,0,0.75)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(26,26,26,0.8)",
            borderRadius: "18px 18px 0 0",
          }}
        >
          <div style={{ display: "flex", gap: 9 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} style={{ width: 15, height: 15, borderRadius: 99, background: c }} />
            ))}
          </div>
          {file && (
            <div
              style={{
                marginLeft: 14,
                padding: "4px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                color: color.zinc400,
                fontFamily: body,
                fontSize: 17,
              }}
            >
              {file}
            </div>
          )}
        </div>

        <Highlight code={source} language={lang} theme={theme}>
          {({ tokens, getTokenProps }) => (
            <div
              data-fit="code"
              data-fit-name={file ?? "code"}
              data-fit-font={fontSize.toFixed(1)}
              style={{ position: "relative", padding: `${padY}px 0`, fontFamily: mono, fontSize, lineHeight: `${lh}px`, color: syntax.variable, fontVariantLigatures: "none" }}
            >
              {/* Line marks: a soft full-width band, never a left border */}
              {activeMarks.map((m) => {
                const tone = m.tone ?? "gold";
                const bg = tone === "gold" ? "rgba(251,198,70,0.09)" : tone === "red" ? "rgba(244,63,94,0.1)" : "rgba(52,211,153,0.09)";
                const o = Math.min(progress(frame, m.from, sec(0.3)), m.until ? 1 - progress(frame, m.until - sec(0.3), sec(0.3)) : 1);
                return (
                  <div
                    key={`${m.lines[0]}-${m.from}`}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: padY + (m.lines[0] - 1) * lh,
                      height: (m.lines[1] - m.lines[0] + 1) * lh,
                      background: bg,
                      opacity: o,
                    }}
                  />
                );
              })}

              {tokens.map((line, li) => {
                const lineNo = li + 1;
                const marked = activeMarks.some((m) => lineNo >= m.lines[0] && lineNo <= m.lines[1]);
                const dim = marked ? 1 : 1 - focusAmount * 0.5;
                let remaining = typed - lineStart[li];
                const visible = remaining > 0 || (remaining === 0 && lines[li].length === 0);
                return (
                  <div key={`${li}-${lines[li]}`} style={{ position: "relative", display: "flex", height: lh, whiteSpace: "pre", opacity: dim }}>
                    {lineNumbers && (
                      <span style={{ width: gutter, paddingRight: cw * 1.4, textAlign: "right", color: color.zinc600, flexShrink: 0, opacity: visible ? 1 : 0.35 }}>
                        {lineNo}
                      </span>
                    )}
                    {!lineNumbers && <span style={{ width: gutter, flexShrink: 0 }} />}
                    <span>
                      {line.map((token, ti) => {
                        if (remaining <= 0) return null;
                        const props = getTokenProps({ token });
                        const content = token.content.slice(0, Math.max(0, remaining));
                        remaining -= token.content.length;
                        return <span key={`${ti}-${token.content}`} {...props} children={content} />;
                      })}
                    </span>
                  </div>
                );
              })}

              {/* The caret while typing */}
              {(typing || (typeFrom !== undefined && frame >= typeFrom - sec(0.5) && typed < totalChars)) && (
                <div
                  style={{
                    position: "absolute",
                    left: gutter + caretCol * cw,
                    top: padY + caretLine * lh + lh * 0.14,
                    width: 3,
                    height: lh * 0.72,
                    background: color.bolt,
                    opacity: typing || Math.floor(frame / 18) % 2 === 0 ? 1 : 0,
                    boxShadow: "0 0 12px rgba(251,198,70,0.7)",
                  }}
                />
              )}

              {/* Type errors: the red squiggle under the exact characters, with the message under it */}
              {squiggles.filter((s) => frame >= s.from).map((s) => {
                const col = findCol(lines[s.line - 1], s.match, s.occurrence);
                if (col < 0) return null;
                const p = progress(frame, s.from, sec(0.45));
                const left = gutter + col * cw;
                const w = s.match.length * cw;
                const top = padY + s.line * lh - lh * 0.16;
                const amp = 3.4;
                const waves = Math.ceil(w / 11);
                const d = `M0 ${amp} ` + Array.from({ length: waves }, () => `q 2.75 -${amp * 2} 5.5 0 t 5.5 0`).join(" ");
                return (
                  <React.Fragment key={`${s.line}-${s.match}`}>
                    <svg width={w} height={12} style={{ position: "absolute", left, top, overflow: "hidden" }}>
                      <path
                        d={d}
                        fill="none"
                        stroke={color.red}
                        strokeWidth={2}
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray="1 1"
                        strokeDashoffset={1 - p}
                        style={{ filter: "drop-shadow(0 0 5px rgba(244,63,94,0.55))" }}
                      />
                    </svg>
                    {s.message && (
                      <div
                        style={{
                          position: "absolute",
                          left: left - 8,
                          top: top + 20,
                          zIndex: 5,
                          maxWidth: 760,
                          padding: "12px 18px",
                          borderRadius: 12,
                          background: "#1f1416",
                          border: "1px solid rgba(244,63,94,0.35)",
                          boxShadow: "0 24px 48px -16px rgba(0,0,0,0.8)",
                          color: "#fda4af",
                          fontFamily: mono,
                          fontSize: Math.max(21, fontSize * 0.8),
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          ...rise(frame, s.from + sec(0.25), 10),
                        }}
                      >
                        {s.message}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Hover types */}
              {hovers.filter(active).map((h) => {
                const col = findCol(lines[h.line - 1], h.match, h.occurrence);
                if (col < 0) return null;
                const out = h.until ? progress(frame, h.until - sec(0.25), sec(0.25)) : 0;
                const r = rise(frame, h.from, 10, sec(0.3));
                return (
                  <React.Fragment key={`${h.line}-${h.match}-${h.from}`}>
                    <div
                      style={{
                        position: "absolute",
                        left: gutter + col * cw - 2,
                        top: padY + (h.line - 1) * lh + 2,
                        width: h.match.length * cw + 4,
                        height: lh - 4,
                        borderRadius: 6,
                        background: "rgba(96,165,250,0.16)",
                        opacity: r.opacity * (1 - out),
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        /* Keep the card inside the window even when the token sits at the end of a long line */
                        left: Math.max(8, Math.min(gutter + col * cw - 10, width - (Math.max(...h.content.split("\n").map((l) => l.length)) * fontSize * 0.78 * 0.6 + 60))),
                        top: padY + h.line * lh + 6,
                        zIndex: 6,
                        padding: "14px 20px",
                        borderRadius: 12,
                        background: "#202023",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.85)",
                        ...r,
                        opacity: r.opacity * (1 - out),
                      }}
                    >
                      <HoverCode code={h.content} fontSize={fontSize * 0.78} />
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Autocomplete */}
              {completes.filter(active).map((c) => {
                const col = findCol(lines[c.line - 1], c.after) + c.after.length;
                const r = rise(frame, c.from, 8, sec(0.25));
                const out = c.until ? progress(frame, c.until - sec(0.2), sec(0.2)) : 0;
                return (
                  <div
                    key={`${c.line}-${c.after}-${c.from}`}
                    style={{
                      position: "absolute",
                      left: gutter + col * cw - 6,
                      top: padY + c.line * lh + 4,
                      zIndex: 6,
                      minWidth: 360,
                      padding: 6,
                      borderRadius: 12,
                      background: "#202023",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.85)",
                      fontSize: fontSize * 0.8,
                      ...r,
                      opacity: r.opacity * (1 - out),
                    }}
                  >
                    {c.items.map((item, i) => (
                      <div
                        key={item.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "6px 14px",
                          borderRadius: 8,
                          background: i === (c.selected ?? 0) ? "rgba(96,165,250,0.18)" : "transparent",
                        }}
                      >
                        <span
                          style={{
                            width: fontSize * 0.8,
                            height: fontSize * 0.8,
                            borderRadius: 4,
                            background: item.kind === "fn" ? "rgba(192,132,252,0.25)" : "rgba(96,165,250,0.25)",
                            color: item.kind === "fn" ? "#d8b4fe" : color.blue,
                            fontSize: fontSize * 0.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: body,
                            fontWeight: 700,
                          }}
                        >
                          {item.kind === "fn" ? "ƒ" : "◆"}
                        </span>
                        <span style={{ color: syntax.variable }}>{item.label}</span>
                        {item.detail && <span style={{ marginLeft: "auto", color: color.zinc500, fontSize: fontSize * 0.66 }}>{item.detail}</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Highlight>
      </div>
    </div>
  );
};

/* Highlighted code with no window, for hover cards and small inline snippets */
export const HoverCode: React.FC<{ code: string; fontSize?: number; lang?: string }> = ({ code, fontSize = 22, lang = "tsx" }) => (
  <Highlight code={code.trim()} language={lang} theme={theme}>
    {({ tokens, getTokenProps }) => (
      <div style={{ fontFamily: mono, fontSize, lineHeight: 1.5, whiteSpace: "pre", color: syntax.variable, fontVariantLigatures: "none" }}>
        {tokens.map((line, li) => (
          <div key={`${li}-${line.map((t) => t.content).join("")}`}>
            {line.map((token, ti) => {
              const props = getTokenProps({ token });
              return <span key={`${ti}-${token.content}`} {...props} />;
            })}
            {line.length === 0 ? " " : null}
          </div>
        ))}
      </div>
    )}
  </Highlight>
);
