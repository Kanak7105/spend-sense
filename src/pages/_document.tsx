import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en-IN" suppressHydrationWarning>
      <Head>
        <meta
          name="description"
          content="Track expenses, budgets and savings goals — built for ₹."
        />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#8e1b1b" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#3a0d0d" />
        <link rel="icon" type="image/png" href="/brand/khata-light.png" />
        {/* PWA: installable from Chrome ("Install app") and iOS Safari (Add to Home Screen). */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SpendSense" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
