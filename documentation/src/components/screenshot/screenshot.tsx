import React, { useEffect, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

import { cn } from "@site/src/lib/utils";

export type ScreenshotMarker = {
  /** Horizontal position of the marker, in percent of the image width */
  x: number;
  /** Vertical position of the marker, in percent of the image height */
  y: number;
  /** What the numbered marker points at, listed under the image */
  label: React.ReactNode;
};

type ScreenshotProps = {
  /** Path of the image in `static/`, such as `/img/hyper-flow/network.png` */
  src: string;
  /** Describes what the image shows, for screen readers and search */
  alt: string;
  /** Short line under the image */
  caption?: React.ReactNode;
  /** Numbered markers drawn over the image and explained in a list under it */
  markers?: ScreenshotMarker[];
  className?: string;
};

/**
 * A screenshot of HyperFlow or another app, framed like a window, with an optional caption and numbered markers.
 * Clicking it opens the image in full size.
 */
export const Screenshot = ({ src, alt, caption, markers, className }: ScreenshotProps) => {
  const url = useBaseUrl(src);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <figure className={cn("my-8 mx-0", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open full size: ${alt}`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-zinc-700/70 bg-zinc-950 p-0 shadow-2xl shadow-black/40 ring-1 ring-white/5 transition hover:border-zinc-500/70"
      >
        <img src={url} alt={alt} loading="lazy" decoding="async" className="block w-full" />
        {markers?.map((marker, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            aria-hidden
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 text-[13px] font-bold text-white shadow-lg shadow-blue-950/60 ring-4 ring-blue-500/30"
          >
            {index + 1}
          </span>
        ))}
      </button>
      {(caption || markers?.length) && (
        <figcaption className="mt-3 text-sm text-zinc-400">
          {caption && <p className="m-0 text-center">{caption}</p>}
          {!!markers?.length && (
            <ol className="mt-4 grid list-none gap-x-6 gap-y-2 pl-0 text-left sm:grid-cols-2">
              {markers.map((marker, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={index} className="m-0 flex gap-3 text-zinc-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{marker.label}</span>
                </li>
              ))}
            </ol>
          )}
        </figcaption>
      )}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          onKeyDown={() => {}}
          className="fixed inset-0 z-[1000] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-10"
        >
          <img src={url} alt={alt} className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}
    </figure>
  );
};
