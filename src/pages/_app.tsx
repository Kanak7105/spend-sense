import type { AppProps } from "next/app";
import { Hind, IBM_Plex_Mono, Kalam } from "next/font/google";
import Head from "next/head";

import type { PageWithLayout } from "@/frontend/components/layout/page-layout";
import { Providers } from "@/frontend/components/providers";

import "@/frontend/styles/globals.css";

// Hind: body and UI (also covers Devanagari). Plex Mono: amounts, dates, labels.
// Kalam: page titles, hero amounts and empty-state headings only.
const hind = Hind({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"] });
const kalam = Kalam({ subsets: ["latin", "devanagari"], weight: ["400", "700"] });

export default function App({ Component, pageProps }: AppProps & { Component: PageWithLayout }) {
  // Layout lives outside the page so the app shell stays mounted between pages.
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>SpendSense</title>
      </Head>
      {/* Font variables on :root so portalled dialogs and menus get them too. */}
      <style jsx global>{`
        :root {
          --font-hind: ${hind.style.fontFamily};
          --font-plex-mono: ${plexMono.style.fontFamily};
          --font-kalam: ${kalam.style.fontFamily};
        }
      `}</style>
      <Providers>
        <div className="flex min-h-svh flex-col">
          {getLayout(<Component {...pageProps} />, pageProps)}
        </div>
      </Providers>
    </>
  );
}
