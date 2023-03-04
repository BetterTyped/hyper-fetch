import { AppProps } from "next/app";
import Head from "next/head";
import { SnackbarProvider } from "notistack";

import "assets/index.css";

function CustomApp({ Component }: AppProps) {
  return (
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
        <Component />
      </main>
    </SnackbarProvider>
  );
}

export default CustomApp;
