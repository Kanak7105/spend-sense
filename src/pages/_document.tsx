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
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
