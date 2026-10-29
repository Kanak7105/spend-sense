import type { AppProps } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";
import Head from "next/head";

import type { PageWithLayout } from "@/frontend/components/layout/page-layout";
import { Providers } from "@/frontend/components/providers";

import "@/frontend/styles/globals.css";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

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
          --font-geist-sans: ${geistSans.style.fontFamily};
          --font-geist-mono: ${geistMono.style.fontFamily};
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
