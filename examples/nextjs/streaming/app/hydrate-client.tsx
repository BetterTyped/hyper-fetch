"use client";

import { Hydrate, type HydrateProps } from "@hyper-fetch/react";
import type { ReactNode } from "react";

import { client } from "@/lib/api";

/** The client instance can't be passed from a server component, so this client component brings it. */
export const HydrateClient = ({ data, children }: { data: HydrateProps["data"]; children: ReactNode }) => (
  <Hydrate client={client} data={data}>
    {children}
  </Hydrate>
);
