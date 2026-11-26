import { useEffect } from "react";
import { useCurrentFrame } from "remotion";

import { isAudit } from "./Timeline";

/*
 * Checks every frame for text that doesn't fit: a code window wider than its panel, a card whose content is clipped,
 * a row label cut with an ellipsis, a code font squeezed below 18px to fit. Each problem is logged once per page as
 * "[fit] ..." and the render script prints them, so stills and renders fail loudly instead of shipping cut text.
 */
const reported = new Set<string>();

export const FitAudit: React.FC<{ video: string }> = ({ video }) => {
  const frame = useCurrentFrame();
  useEffect(() => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-fit]"))) {
      const kind = el.dataset.fit;
      const name = el.dataset.fitName ?? (el.textContent ?? "").trim().slice(0, 48);
      const wide = el.scrollWidth - el.clientWidth;
      const tall = kind === "card" ? el.scrollHeight - el.clientHeight : 0;
      const font = el.dataset.fitFont ? Number(el.dataset.fitFont) : undefined;
      const problems: string[] = [];
      if (wide > 2) problems.push(`${wide}px too wide`);
      if (tall > 2) problems.push(`${tall}px too tall`);
      if (font !== undefined && font < 18) problems.push(`code font shrunk to ${font}px`);
      if (problems.length === 0) continue;
      const key = `${video}|${kind}|${name}|${problems.join(",")}`;
      if (reported.has(key)) continue;
      reported.add(key);
      console.warn(`[fit] ${video} frame ${frame}: ${kind} "${name}" ${problems.join(", ")}`);
    }
    /*
     * Title words rise out of a clip box. Before a word rises it must sit entirely below the box: if any of it is
     * inside, the tops of its letters show as slivers at the bottom of the box (it happened on every title). And the
     * box needs side room, or it slices the overhang of the last letter. Both are measured relative to the box, so
     * they hold in renders too, not only in audit mode.
     */
    for (const word of Array.from(document.querySelectorAll<HTMLElement>("[data-rise='pending']"))) {
      const clip = word.closest<HTMLElement>("[data-rise-clip]");
      if (!clip) continue;
      const c = clip.getBoundingClientRect();
      const r = word.getBoundingClientRect();
      if (c.height <= 0) continue;
      const inside = c.bottom - r.top;
      if (inside <= 0.5) continue;
      const name = (word.textContent ?? "").trim();
      const key = `${video}|peek|${name}`;
      if (reported.has(key)) continue;
      reported.add(key);
      console.warn(`[fit] ${video} frame ${frame}: title word "${name}" shows ${Math.round(inside)}px inside its clip before it rises`);
    }
    for (const clip of Array.from(document.querySelectorAll<HTMLElement>("[data-rise-clip]"))) {
      const style = getComputedStyle(clip);
      const room = parseFloat(style.paddingRight) / parseFloat(style.fontSize);
      if (room >= 0.1) continue;
      const name = (clip.textContent ?? "").trim();
      const key = `${video}|side|${name}`;
      if (reported.has(key)) continue;
      reported.add(key);
      console.warn(`[fit] ${video} frame ${frame}: title word "${name}" has no side room in its clip; its last letter gets cut`);
    }
    /*
     * Overlap: two solid things (cards, code windows, chips) in the same scene that cross each other without one
     * containing the other, once both are fully visible. Entering animations are skipped by the opacity check.
     */
    const visible = (el: HTMLElement) => {
      let o = 1;
      for (let n: HTMLElement | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity || 1);
      return o > 0.97;
    };
    /* Safe area: nothing solid within 100px of a side or 60px of the top and bottom, like a title-safe margin on TV */
    /* Sides get more room than top and bottom: cards near a side edge look cramped long before they touch it */
    const SAFE_X = 100;
    const SAFE_Y = 60;
    const W = 1920;
    const H = 1080;
    for (const scene of Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"))) {
      const solids = Array.from(scene.querySelectorAll<HTMLElement>("[data-solid]")).filter(visible);
      const rects = solids.map((el) => el.getBoundingClientRect());
      /* Geometry is only true in audit mode, where scenes are laid out in the real frame (see Timeline) */
      if (!isAudit()) continue;
      /* Measured from the video's root: the renderer may park the whole page off-screen */
      const root = document.querySelector<HTMLElement>("[data-frame]")?.getBoundingClientRect();
      const box = root ? { left: root.left, top: root.top, right: root.left + W, bottom: root.top + H } : { left: 0, top: 0, right: W, bottom: H };
      const fx = 1;
      solids.forEach((el, i) => {
        const r = rects[i];
        const gaps = {
          left: (r.left - box.left) / fx,
          right: (box.right - r.right) / fx,
          top: (r.top - box.top) / fx,
          bottom: (box.bottom - r.bottom) / fx,
        };
        const tight = Object.entries(gaps).filter(([side, g]) => g < (side === "left" || side === "right" ? SAFE_X : SAFE_Y));
        if (tight.length === 0) return;
        const label = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 32);
        const key = `${video}|edge|${scene.dataset.scene}|${label}`;
        if (reported.has(key)) return;
        reported.add(key);
        console.warn(`[fit] ${video} frame ${frame}: "${label}" in "${scene.dataset.scene}" is ${tight.map(([side, g]) => `${Math.round(g)}px from the ${side} edge`).join(", ")} (keep ${SAFE_X}px at the sides, ${SAFE_Y}px top and bottom)`);
      });
      /*
       * Cables: an end must sit on a card's edge, never inside it, and the middle of the cable never runs under a
       * card. A cable drawn before a card it touches is painted over, so its end vanishes behind the card (the tRPC
       * scene shipped that way).
       */
      const inside = (x: number, y: number, r: DOMRect, inset: number) =>
        x > r.left + inset && x < r.right - inset && y > r.top + inset && y < r.bottom - inset;
      const cardName = (el: HTMLElement) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 32);
      const warnCable = (what: string, el: HTMLElement) => {
        const key = `${video}|cable|${scene.dataset.scene}|${what}|${cardName(el)}`;
        if (reported.has(key)) return;
        reported.add(key);
        console.warn(`[fit] ${video} frame ${frame}: a cable ${what} "${cardName(el)}" in "${scene.dataset.scene}"`);
      };
      for (const end of Array.from(scene.querySelectorAll<SVGElement>("[data-beam-end]"))) {
        const e = end.getBoundingClientRect();
        const cx = e.left + e.width / 2;
        const cy = e.top + e.height / 2;
        solids.forEach((el, i) => {
          if (inside(cx, cy, rects[i], 8)) warnCable("ends inside", el);
        });
      }
      for (const track of Array.from(scene.querySelectorAll<SVGPathElement>("[data-beam-track]"))) {
        const ctm = track.getScreenCTM();
        if (!ctm) continue;
        const total = track.getTotalLength();
        for (const at of [0.35, 0.5, 0.65]) {
          const p = track.getPointAtLength(total * at).matrixTransform(ctm);
          solids.forEach((el, i) => {
            if (inside(p.x, p.y, rects[i], 4)) warnCable("runs under", el);
          });
        }
      }
      for (let i = 0; i < solids.length; i += 1) {
        for (let j = i + 1; j < solids.length; j += 1) {
          const a = solids[i];
          const b = solids[j];
          if (a.contains(b) || b.contains(a)) continue;
          const ra = rects[i];
          const rb = rects[j];
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w <= 6 || h <= 6) continue;
          const name = (el: HTMLElement) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 32);
          const key = `${video}|overlap|${scene.dataset.scene}|${name(a)}|${name(b)}`;
          if (reported.has(key)) continue;
          reported.add(key);
          console.warn(`[fit] ${video} frame ${frame}: overlap in "${scene.dataset.scene}": "${name(a)}" × "${name(b)}" (${Math.round(w)}×${Math.round(h)}px)`);
        }
      }
    }
  }, [frame, video]);
  return null;
};
