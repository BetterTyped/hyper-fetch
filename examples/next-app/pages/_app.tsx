import { Provider } from "@hyper-fetch/react";
import { AppProps } from "next/app";
import Head from "next/head";
import { SnackbarProvider } from "notistack";

import { client } from "../api";

// import "assets/index.css";

function CustomApp({ Component, pageProps }: AppProps) {
  if (pageProps?.fallbacks) {
    client.hydrate(pageProps.fallbacks);
  }

  return (
    <Provider>
      <SnackbarProvider
        maxSnack={6}
        autoHideDuration={1000}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Head>
          <title>Nextjs</title>
        </Head>
        <main className="app">
          <Component {...pageProps} />
        </main>
      </SnackbarProvider>
    </Provider>
  );
}

export default CustomApp;
