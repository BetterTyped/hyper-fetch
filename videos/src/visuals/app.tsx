import React from "react";
import { useCurrentFrame } from "remotion";

import { deal, pop } from "../brand/motion";
import { body, color, mono } from "../brand/tokens";
import { Card, Chip } from "../brand/ui";

/*
 * The product surface of the "No second fetch" scene, shared: a browser or app window with traffic lights and an
 * address pill, a body for real-looking rows, and a footer that carries the one status the scene is about
 * ("0 requests", "201 Created", "replayed"). Pair it with one or two CodeWindows and a Beam between them.
 */
export const AppWindow: React.FC<{
  /* The address or title in the pill, e.g. "/users" or "HyperFlow" */
  address: string;
  /* A small status on the right of the title bar, e.g. a live dot */
  headerRight?: React.ReactNode;
  /* The footer's left label, e.g. "network"; omit for no footer */
  footer?: string;
  /* The footer's status, shown from `statusAt` with a pop */
  status?: React.ReactNode;
  statusAt?: number;
  statusTone?: "green" | "gold" | "red" | "zinc" | "blue";
  width?: number;
  minHeight?: number;
  at?: number;
  order?: number;
  children: React.ReactNode;
}> = ({ address, headerRight, footer, status, statusAt = 0, statusTone = "green", width = 560, minHeight = 300, at = 0, order = 3, children }) => {
  const frame = useCurrentFrame();
  return (
    <div style={deal(frame, at, order)}>
      <Card radius={24} style={{ width, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${color.line}` }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
          ))}
          <span style={{ marginLeft: 14, padding: "4px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", fontFamily: mono, fontSize: 20, color: color.zinc400, whiteSpace: "nowrap" }}>
            {address}
          </span>
          {headerRight && <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10, fontFamily: body, fontSize: 19, color: color.zinc400, whiteSpace: "nowrap" }}>{headerRight}</span>}
        </div>
        <div style={{ padding: "22px 24px", minHeight }}>{children}</div>
        {footer && (
          <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderTop: `1px solid ${color.line}`, fontFamily: mono, fontSize: 20, color: color.zinc500 }}>
            <span>{footer}</span>
            <span style={{ marginLeft: "auto" }}>
              {status && frame >= statusAt && (
                <span style={{ display: "inline-block", transform: `scale(${pop(frame, statusAt)})` }}>
                  <Chip tone={statusTone} size={19}>
                    {status}
                  </Chip>
                </span>
              )}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};

/* The empty state before data paints: quiet placeholder rows */
export const Skeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} style={{ height: 64, borderRadius: 14, background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }} />
    ))}
  </div>
);

/* A small grey label above a code window, like "Server" and "Client" */
export const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: body, fontWeight: 600, fontSize: 22, color: color.zinc500 }}>{children}</span>
);
