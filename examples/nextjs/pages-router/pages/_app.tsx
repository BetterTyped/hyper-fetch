import "@picocss/pico/css/pico.min.css";
import "../styles/globals.css";
import { Hydrate, type HydrateProps } from "@hyper-fetch/react";
import type { AppProps } from "next/app";
import Head from "next/head";

import { client } from "@/lib/api";

/** Pages pass their dehydrated responses as `hydration`. One `Hydrate` here serves every page. */
export type HydrationProps = { hydration?: HydrateProps["data"] };

export default function App({ Component, pageProps }: AppProps<HydrationProps>) {
  return (
    <Hydrate client={client} data={pageProps.hydration}>
      <Head>
        <title>HyperFetch - Next.js Pages Router</title>
      </Head>
      <main className="container">
        <Component {...pageProps} />
      </main>
    </Hydrate>
  );
}
